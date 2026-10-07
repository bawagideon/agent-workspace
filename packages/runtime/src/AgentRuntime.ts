import crypto from 'crypto';
import { Task, TaskStatus, ExecutionPlan, ApprovalRequest, ExecutionContract } from '@gideon/shared';
import { PolicyEngine, RiskEngine } from '@gideon/policy';
import { MemoryEngine, LessonExtractor } from '@gideon/memory';
import { JobExecutor } from '@gideon/runner';
import { ContextBuilder } from './ContextBuilder';
import { SelfReviewer } from './SelfReviewer';
import { SentinelQARunner } from './SentinelQARunner';
import { ModelProvider } from './providers/ModelProvider';
import { GeminiProvider } from './providers/GeminiProvider';
import { MockProvider } from './providers/MockProvider';
import { RuntimeStateMachine } from './RuntimeStateMachine';
import { SolutionBriefEngine, EngineeringSolutionBrief } from './forge/SolutionBriefEngine';

export class AgentRuntime {
  private contextBuilder: ContextBuilder;
  private lessonExtractor: LessonExtractor;
  private sentinelQA: SentinelQARunner;
  private modelProvider: ModelProvider;

  constructor(
    private policyEngine: PolicyEngine,
    private memoryEngine: MemoryEngine,
    private jobExecutor: JobExecutor,
    modelProvider?: ModelProvider
  ) {
    this.modelProvider = modelProvider || (process.env.GEMINI_API_KEY ? new GeminiProvider(process.env.GEMINI_API_KEY) : new MockProvider());
    this.contextBuilder = new ContextBuilder(memoryEngine);
    this.lessonExtractor = new LessonExtractor(memoryEngine);
    this.sentinelQA = new SentinelQARunner(this.modelProvider, this.jobExecutor, this.policyEngine);
  }

  public async executeTask(
    task: Task,
    onStatusChange?: (status: TaskStatus) => void,
    onApprovalRequired?: (approval: ApprovalRequest) => Promise<boolean>
  ): Promise<{ success: boolean; plan: ExecutionPlan; summary: string }> {
    const workspaceId = task.workspaceId || 'ws-agent-workspace';
    const agentId = task.assignedAgentId || 'forge';

    // 1. Intake & Context Retrieval
    onStatusChange?.('CONTEXT_LOADING');
    const context = await this.contextBuilder.buildContext(agentId, workspaceId);

    // 2. Planning via Model Provider & Forge Solution Brief
    onStatusChange?.('PLANNING');
    let solutionBrief: EngineeringSolutionBrief | undefined;
    if (agentId === 'forge') {
      solutionBrief = SolutionBriefEngine.generateBrief({
        goal: task.goal,
        taskId: task.id,
        missionId: (task as any).missionId,
        workspacePath: workspaceId
      });
    }

    const plan = await this.modelProvider.generatePlan(task.goal, {
      workspaceId,
      agentId,
      taskRunId: `run-${Date.now()}`
    });
    if (solutionBrief) {
      (plan as any).solutionBrief = solutionBrief;
    }

    // Sanitize and guarantee required parameters for registered tools
    for (const step of plan.steps) {
      step.inputParams = step.inputParams || {};
      step.inputParams.workspaceId = step.inputParams.workspaceId || workspaceId;

      // Authoritative source guard: prevent modifying derived output files directly
      if (step.inputParams.filePath) {
        const authCheck = SolutionBriefEngine.verifyAuthoritativeTarget(step.inputParams.filePath);
        if (!authCheck.isAuthoritative && authCheck.correctedPath) {
          step.inputParams.filePath = authCheck.correctedPath;
          step.description = `${step.description} [AUTOCORRECTED TO: ${authCheck.correctedPath}]`;
        }
      }

      switch (step.toolId) {
        case 'fs_list_dir':
          if (typeof step.inputParams.directoryPath !== 'string') {
            step.inputParams.directoryPath = step.inputParams.path || '';
          }
          break;
        case 'fs_read_file':
          if (typeof step.inputParams.filePath !== 'string') {
            step.inputParams.filePath = step.inputParams.path || 'src/index.ts';
          }
          break;
        case 'fs_write_file':
          if (typeof step.inputParams.filePath !== 'string') {
            step.inputParams.filePath = step.inputParams.path || 'src/index.ts';
          }
          if (typeof step.inputParams.content !== 'string') {
            step.inputParams.content = '';
          }
          break;
        case 'fs_search':
          if (typeof step.inputParams.query !== 'string') {
            step.inputParams.query = step.inputParams.search || step.inputParams.term || step.inputParams.filePattern || task.goal || 'index';
          }
          break;
        case 'terminal_run_command':
          if (typeof step.inputParams.command !== 'string') {
            step.inputParams.command = 'npm test';
          }
          break;
        case 'git_status':
        case 'git_diff':
          // workspaceId already ensured
          break;
      }
    }

    // 3. Formulate Execution Contract
    const allowedPaths = plan.steps
      .filter((s) => s.inputParams.filePath)
      .map((s) => s.inputParams.filePath);

    const allowedCommands = plan.steps
      .filter((s) => s.inputParams.command)
      .map((s) => s.inputParams.command);

    const contract = this.policyEngine.generateExecutionContract({
      taskId: task.id,
      runId: plan.taskRunId,
      workspaceId,
      runnerId: 'GIDMACHINE_WIN',
      allowedPaths,
      allowedTools: plan.steps.map((s) => s.toolId),
      allowedCommands,
      maxSteps: plan.steps.length + 2,
      maxRuntimeMs: 300000,
      maxCost: 0.50,
      approvalMode: task.autonomyMode || 'PLAN_APPROVAL',
      rollbackStrategy: 'FILE_BACKUP',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    });

    const stepOutputs: Array<{ toolId: string; result: any; error?: string }> = [];

    // 4. Step-by-Step Execution with Strict Authorization
    for (const step of plan.steps) {
      const riskResult = this.policyEngine.evaluate({
        toolId: step.toolId,
        actionType: step.riskLevel === 'LOW' ? 'FILE_READ' : 'FILE_WRITE',
        workspaceAccessMode: 'READ_WRITE'
      });

      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      // Generate Cryptographic Authorization Token
      const authorizationHash = this.policyEngine.generateAuthorizationHash({
        agentId,
        workspaceId,
        toolId: step.toolId,
        params: step.inputParams,
        expiresAt
      });

      // Handle Approval Gate if required
      if (riskResult.approvalMode === 'PLAN' || riskResult.approvalMode === 'ALWAYS_ASK') {
        onStatusChange?.('WAITING_APPROVAL');

        const approvalReq: ApprovalRequest = {
          id: `appr-${Date.now()}`,
          taskId: task.id,
          agentId,
          workspaceId,
          riskLevel: riskResult.riskLevel,
          approvalMode: riskResult.approvalMode,
          actionType: step.riskLevel === 'LOW' ? 'FILE_READ' : 'FILE_WRITE',
          description: step.description,
          authorizationHash,
          status: 'PENDING',
          expiresAt,
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
        agentId,
        workspaceId,
        toolId: step.toolId,
        inputParams: step.inputParams,
        authorizationHash,
        expiresAt,
        idempotencyKey: `idemp-${step.id}`,
        contract
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

    // 5. Forge Self Review Scorecard
    onStatusChange?.('SELF_REVIEW');
    const scorecard = SelfReviewer.evaluateResults(stepOutputs);

    // 6. Independent Sentinel QA Audit
    onStatusChange?.('QA_PENDING');
    onStatusChange?.('QA_EXECUTING');
    const qaResult = await this.sentinelQA.auditWork({
      task,
      workspaceId,
      diff: JSON.stringify(stepOutputs),
      modifiedFiles: allowedPaths
    });

    if (!qaResult.passed) {
      onStatusChange?.('FAILED');
      return {
        success: false,
        plan,
        summary: `Task failed Sentinel QA Audit: ${JSON.stringify(qaResult.bugsReported)}`
      };
    }

    // 7. Memory Lesson Extraction (Quarantined as CANDIDATE initially)
    await this.lessonExtractor.extractAndProposeLesson({
      taskId: task.id,
      taskTitle: task.title,
      workspaceId,
      agentId,
      executionSuccess: scorecard.passed && qaResult.passed,
      toolOutputs: stepOutputs.map((s) => ({ toolId: s.toolId, output: s.result ?? s.error })),
      selfReviewNotes: scorecard.notes.join('; ')
    });

    const evidencePayload = {
      taskId: task.id,
      taskTitle: task.title,
      agentId,
      workspaceId,
      forgeScore: scorecard.score,
      sentinelScore: qaResult.score,
      allowedPaths,
      timestamp: new Date().toISOString()
    };
    const evidenceHash = crypto.createHash('sha256').update(JSON.stringify(evidencePayload)).digest('hex');

    onStatusChange?.('COMPLETED');
    return {
      success: true,
      plan,
      summary: `Task completed successfully. Forge Score: ${scorecard.score}/100. Sentinel QA: PASSED (${qaResult.score}/100). SHA-256 Seal: ${evidenceHash}`,
      evidenceHash,
      solutionBrief
    } as any;
  }
}
