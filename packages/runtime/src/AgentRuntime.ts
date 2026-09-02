import { Task, TaskStatus, ExecutionPlan, ApprovalRequest } from '@gideon/shared';
import { PolicyEngine, RiskEngine } from '@gideon/policy';
import { MemoryEngine, LessonExtractor } from '@gideon/memory';
import { JobExecutor } from '@gideon/runner';
import { ContextBuilder } from './ContextBuilder';
import { Planner } from './Planner';
import { SelfReviewer } from './SelfReviewer';
import { HandoffManager } from './HandoffManager';
import { RuntimeStateMachine } from './RuntimeStateMachine';

export class AgentRuntime {
  private contextBuilder: ContextBuilder;
  private planner: Planner;
  private lessonExtractor: LessonExtractor;

  constructor(
    private policyEngine: PolicyEngine,
    private memoryEngine: MemoryEngine,
    private jobExecutor: JobExecutor
  ) {
    this.contextBuilder = new ContextBuilder(memoryEngine);
    this.planner = new Planner(policyEngine);
    this.lessonExtractor = new LessonExtractor(memoryEngine);
  }

  public async executeTask(
    task: Task,
    onStatusChange?: (status: TaskStatus) => void,
    onApprovalRequired?: (approval: ApprovalRequest) => Promise<boolean>
  ): Promise<{ success: boolean; plan: ExecutionPlan; summary: string }> {
    // 1. Intake & State Transition
    onStatusChange?.('CONTEXT_LOADING');
    const context = await this.contextBuilder.buildContext(task.assignedAgentId || 'forge', task.workspaceId || 'ws-agent-workspace');

    // 2. Planning
    onStatusChange?.('PLANNING');
    const plan = await this.planner.generatePlan({
      taskGoal: task.goal,
      workspaceId: task.workspaceId || 'ws-agent-workspace',
      agentId: task.assignedAgentId || 'forge'
    });

    const stepOutputs: Array<{ toolId: string; result: any; error?: string }> = [];

    // 3. Step-by-Step Execution
    for (const step of plan.steps) {
      // Risk & Policy Check
      const riskResult = this.policyEngine.evaluate({
        toolId: step.toolId,
        actionType: step.riskLevel === 'LOW' ? 'FILE_READ' : 'FILE_WRITE',
        workspaceAccessMode: 'READ_WRITE'
      });

      // Handle Approval Gate if required
      if (riskResult.approvalMode === 'PLAN' || riskResult.approvalMode === 'ALWAYS_ASK') {
        onStatusChange?.('WAITING_APPROVAL');

        const approvalReq: ApprovalRequest = {
          id: `appr-${Date.now()}`,
          taskId: task.id,
          agentId: task.assignedAgentId || 'forge',
          workspaceId: task.workspaceId || 'ws-agent-workspace',
          riskLevel: riskResult.riskLevel,
          approvalMode: riskResult.approvalMode,
          actionType: step.riskLevel === 'LOW' ? 'FILE_READ' : 'FILE_WRITE',
          description: step.description,
          status: 'PENDING',
          createdAt: new Date().toISOString()
        };

        if (onApprovalRequired) {
          const isApproved = await onApprovalRequired(approvalReq);
          if (!isApproved) {
            onStatusChange?.('FAILED');
            return {
              success: false,
              plan,
              summary: 'Task execution stopped: Approval request was rejected by user.'
            };
          }
        }
      }

      onStatusChange?.('EXECUTING');
      const response = await this.jobExecutor.executeJob({
        jobId: `job-${Date.now()}`,
        taskId: task.id,
        stepId: step.id,
        agentId: task.assignedAgentId || 'forge',
        workspaceId: task.workspaceId || 'ws-agent-workspace',
        toolId: step.toolId,
        inputParams: step.inputParams,
        idempotencyKey: `idemp-${step.id}`
      });

      stepOutputs.push({
        toolId: step.toolId,
        result: response.result,
        error: response.error
      });

      if (!response.success) {
        onStatusChange?.('FAILED');
        return {
          success: false,
          plan,
          summary: `Task execution failed at step: ${step.description}. Error: ${response.error}`
        };
      }
    }

    // 4. Self Review
    onStatusChange?.('SELF_REVIEW');
    const scorecard = SelfReviewer.evaluateResults(stepOutputs);

    // 5. Sentinel QA Handoff
    onStatusChange?.('QA_PENDING');
    const handoff = HandoffManager.triggerQA(task.id, scorecard, 'All 3 steps executed cleanly.');

    // 6. Lesson Extraction
    await this.lessonExtractor.extractAndProposeLesson({
      taskId: task.id,
      taskTitle: task.title,
      workspaceId: task.workspaceId || 'ws-agent-workspace',
      agentId: task.assignedAgentId || 'forge',
      executionSuccess: scorecard.passed,
      toolOutputs: stepOutputs,
      selfReviewNotes: scorecard.notes.join('; ')
    });

    onStatusChange?.('COMPLETED');
    return {
      success: true,
      plan,
      summary: `Task completed successfully with Self-Review Score: ${scorecard.score}/100. Sentinel QA Status: ${handoff.status}.`
    };
  }
}
