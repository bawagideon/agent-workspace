import { QAReviewResult, Task } from '@gideon/shared';
import { ModelProvider } from './providers/ModelProvider';
import { JobExecutor } from '@gideon/runner';
import { PolicyEngine } from '@gideon/policy';

export interface SentinelAuditInput {
  task: Task;
  workspaceId: string;
  diff: string;
  modifiedFiles: string[];
}

export class SentinelQARunner {
  constructor(
    private modelProvider: ModelProvider,
    private jobExecutor: JobExecutor,
    private policyEngine?: PolicyEngine
  ) {}

  public async auditWork(input: SentinelAuditInput): Promise<QAReviewResult> {
    console.log(`[Sentinel QA] 🛡️ Starting independent QA audit for task: "${input.task.title}"`);
    console.log(`[Sentinel QA] Modified files under review: ${input.modifiedFiles.join(', ')}`);

    // 1. Independent test execution with cryptographic authorization
    let testLogs = '';
    try {
      const params = {
        workspaceId: input.workspaceId,
        command: 'npm test',
        timeoutMs: 60000
      };

      const expiresAt = new Date(Date.now() + 120000).toISOString();
      const authorizationHash = this.policyEngine?.generateAuthorizationHash({
        agentId: 'sentinel',
        workspaceId: input.workspaceId,
        toolId: 'terminal_run_command',
        params,
        expiresAt
      });

      const testJob = await this.jobExecutor.executeJob({
        jobId: `qa-job-${Date.now()}`,
        taskId: input.task.id,
        agentId: 'sentinel',
        workspaceId: input.workspaceId,
        toolId: 'terminal_run_command',
        inputParams: params,
        authorizationHash,
        expiresAt
      });

      const exitCode = testJob.result?.exitCode ?? (testJob.success ? 0 : 1);
      const stdout = testJob.result?.stdout || '';
      const stderr = testJob.result?.stderr || '';
      testLogs = `[EXIT_CODE: ${exitCode}]\n${stdout}\n${stderr}`;

      if (exitCode !== 0) {
        testLogs += `\n[ERROR: Subprocess exited with failure code ${exitCode}]`;
      }
    } catch (err: any) {
      testLogs = `[EXIT_CODE: 1]\nTest execution error: ${err.message}`;
    }

    // 2. Independent Model Provider Review
    const qaResult = await this.modelProvider.reviewCode(input.task.goal, input.diff, testLogs);

    console.log(`[Sentinel QA] Scorecard: ${qaResult.score}/100 | Passed: ${qaResult.passed ? 'YES' : 'NO'}`);
    if (!qaResult.passed) {
      console.warn(`[Sentinel QA] ⚠️ Bugs reported: ${JSON.stringify(qaResult.bugsReported)}`);
    }

    return qaResult;
  }
}
