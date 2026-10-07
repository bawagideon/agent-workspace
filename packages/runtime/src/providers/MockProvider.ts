import { ModelProvider } from './ModelProvider';
import { ExecutionPlan, QAReviewResult, PlanStep } from '@gideon/shared';

export class MockProvider implements ModelProvider {
  public name = 'Deterministic Mock Provider';

  public async generatePlan(goal: string, context: Record<string, any>): Promise<ExecutionPlan> {
    const steps: PlanStep[] = [
      {
        id: 'step-1',
        planId: `plan-${Date.now()}`,
        stepNumber: 1,
        description: 'Inspect workspace files and directory hierarchy',
        toolId: 'fs_list_dir',
        inputParams: { workspaceId: context.workspaceId, directoryPath: '' },
        riskLevel: 'LOW',
        expectedOutcome: 'Understand directory structure',
        verificationMethod: 'Directory listing',
        rollbackStrategy: 'None',
        status: 'PENDING'
      }
    ];

    if (/fix|update|modify|change|write/i.test(goal)) {
      steps.push({
        id: 'step-2',
        planId: `plan-${Date.now()}`,
        stepNumber: 2,
        description: `Apply targeted code modification for: ${goal}`,
        toolId: 'fs_write_file',
        inputParams: {
          workspaceId: context.workspaceId,
          filePath: context.targetPath || 'src/index.ts',
          content: `// Verified fix for: ${goal}\nexport const isHealthy = true;\n`
        },
        riskLevel: 'MEDIUM',
        expectedOutcome: 'Target file updated cleanly',
        verificationMethod: 'npm test',
        rollbackStrategy: 'Git checkout or file restore',
        status: 'PENDING'
      });

      steps.push({
        id: 'step-3',
        planId: `plan-${Date.now()}`,
        stepNumber: 3,
        description: 'Run test suite verification',
        toolId: 'terminal_run_command',
        inputParams: {
          workspaceId: context.workspaceId,
          command: 'npm test',
          timeoutMs: 60000
        },
        riskLevel: 'LOW',
        expectedOutcome: 'Tests pass with 0 errors',
        verificationMethod: 'Exit code 0',
        rollbackStrategy: 'Revert file modification',
        status: 'PENDING'
      });
    }

    return {
      id: `plan-${Date.now()}`,
      taskRunId: context.taskRunId || `run-${Date.now()}`,
      version: 1,
      status: 'PROPOSED',
      steps,
      createdAt: new Date().toISOString()
    };
  }

  public async reviewCode(taskGoal: string, diff: string, testLogs: string): Promise<QAReviewResult> {
    const hasFailures = testLogs.includes('FAIL') || testLogs.includes('ERR!');
    return {
      passed: !hasFailures,
      score: hasFailures ? 30 : 100,
      typeCheckPassed: true,
      testsPassed: !hasFailures,
      securityClean: true,
      bugsReported: hasFailures
        ? [{ file: 'src/index.ts', severity: 'HIGH', message: 'Test execution returned failure.' }]
        : [],
      feedbackForForge: hasFailures ? 'Tests failed. Rework required.' : 'QA passed with 100% confidence.'
    };
  }
}
