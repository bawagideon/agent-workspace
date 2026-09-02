import { PlanStep, ExecutionPlan, RiskLevel } from '@gideon/shared';
import { PolicyEngine } from '@gideon/policy';
import { ToolRegistry } from '@gideon/tools';

export interface PlanGenerationInput {
  taskGoal: string;
  workspaceId: string;
  agentId: string;
  inspectionResults?: any;
}

export class Planner {
  constructor(private policyEngine: PolicyEngine) {}

  public async generatePlan(input: PlanGenerationInput): Promise<ExecutionPlan> {
    // In Phase 4 MVP: Deterministic / LLM-ready structured planner
    const steps: PlanStep[] = [];

    // Step 1: Safe read inspection
    steps.push({
      id: `step-1`,
      planId: `plan-${Date.now()}`,
      stepNumber: 1,
      description: 'Inspect workspace directory and read relevant files',
      toolId: 'fs_list_dir',
      inputParams: { workspaceId: input.workspaceId, directoryPath: '', recursive: false },
      riskLevel: 'LOW',
      expectedOutcome: 'Understand directory structure',
      verificationMethod: 'Directory listing returned',
      rollbackStrategy: 'None needed (Read-only)',
      status: 'PENDING'
    });

    // Step 2: Formulate verified modification (if goal requires code change)
    if (/fix|update|modify|change|write/i.test(input.taskGoal)) {
      steps.push({
        id: `step-2`,
        planId: `plan-${Date.now()}`,
        stepNumber: 2,
        description: `Apply targeted code modification for: ${input.taskGoal}`,
        toolId: 'fs_write_file',
        inputParams: {
          workspaceId: input.workspaceId,
          filePath: 'src/components/VerifiedComponent.tsx',
          content: `// Verified fix for: ${input.taskGoal}\nexport const VerifiedComponent = () => <div>Fixed</div>;\n`
        },
        riskLevel: 'MEDIUM',
        expectedOutcome: 'Target file updated cleanly',
        verificationMethod: 'Run build/typecheck',
        rollbackStrategy: 'Git checkout or file restore',
        status: 'PENDING'
      });

      // Step 3: Run verification tests
      steps.push({
        id: `step-3`,
        planId: `plan-${Date.now()}`,
        stepNumber: 3,
        description: 'Run TypeScript compiler / test suite to verify no regressions',
        toolId: 'terminal_run_command',
        inputParams: {
          workspaceId: input.workspaceId,
          command: 'npm test',
          timeoutMs: 60000
        },
        riskLevel: 'LOW',
        expectedOutcome: 'Tests pass with 0 errors',
        verificationMethod: 'Exit code 0',
        rollbackStrategy: 'Revert file modification if test fails',
        status: 'PENDING'
      });
    }

    const planId = `plan-${Date.now()}`;
    const planToken = this.policyEngine.generateAuthorizationHash({
      agentId: input.agentId,
      workspaceId: input.workspaceId,
      toolId: 'execution_plan',
      params: { goal: input.taskGoal, stepCount: steps.length },
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    });

    return {
      id: planId,
      taskRunId: `run-${Date.now()}`,
      version: 1,
      status: 'PROPOSED',
      riskSummary: steps.some((s) => s.riskLevel === 'HIGH' || s.riskLevel === 'CRITICAL')
        ? 'HIGH_RISK_ACTIONS_DETECTED'
        : 'NORMAL_OPERATION',
      steps,
      planToken,
      createdAt: new Date().toISOString()
    };
  }
}
