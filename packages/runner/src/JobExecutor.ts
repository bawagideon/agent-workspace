import { ToolRegistry } from '@gideon/tools';
import { PolicyEngine } from '@gideon/policy';
import { WorkspaceSandbox } from './sandbox/WorkspaceSandbox';
import { FsExecutor } from './executors/FsExecutor';
import { ProcessExecutor } from './executors/ProcessExecutor';
import { GitExecutor } from './executors/GitExecutor';
import { KillSwitch } from './KillSwitch';

export interface ExecutionJobRequest {
  jobId: string;
  taskId: string;
  stepId?: string;
  agentId: string;
  workspaceId: string;
  toolId: string;
  inputParams: Record<string, any>;
  authorizationHash?: string;
  expiresAt?: string;
  idempotencyKey?: string;
}

export interface ExecutionJobResponse {
  jobId: string;
  success: boolean;
  result?: any;
  error?: string;
  durationMs: number;
}

export class JobExecutor {
  private fsExecutor: FsExecutor;
  private processExecutor: ProcessExecutor;
  private gitExecutor: GitExecutor;
  private executedIdempotencyKeys: Set<string> = new Set();

  constructor(
    private sandbox: WorkspaceSandbox,
    private policyEngine: PolicyEngine
  ) {
    this.fsExecutor = new FsExecutor(sandbox);
    this.processExecutor = new ProcessExecutor(sandbox);
    this.gitExecutor = new GitExecutor(this.processExecutor);
  }

  public async executeJob(request: ExecutionJobRequest): Promise<ExecutionJobResponse> {
    const startTime = Date.now();

    if (KillSwitch.isHalted()) {
      return {
        jobId: request.jobId,
        success: false,
        error: 'Execution rejected: Emergency Kill Switch is ACTIVE.',
        durationMs: 0
      };
    }

    // 1. Idempotency Check
    if (request.idempotencyKey && this.executedIdempotencyKeys.has(request.idempotencyKey)) {
      return {
        jobId: request.jobId,
        success: true,
        result: { skipped: true, reason: 'Step already executed (idempotency matched).' },
        durationMs: 0
      };
    }

    // 2. Tool validation
    const tool = ToolRegistry.get(request.toolId);
    if (!tool) {
      return {
        jobId: request.jobId,
        success: false,
        error: `Tool not found in registry: ${request.toolId}`,
        durationMs: Date.now() - startTime
      };
    }

    const validation = ToolRegistry.validateInput(request.toolId, request.inputParams);
    if (!validation.success) {
      return {
        jobId: request.jobId,
        success: false,
        error: `Tool input validation failed: ${validation.error}`,
        durationMs: Date.now() - startTime
      };
    }

    try {
      let result: any;

      switch (request.toolId) {
        case 'fs_read_file':
          result = await this.fsExecutor.readFile(request.workspaceId, request.inputParams.filePath);
          break;

        case 'fs_write_file':
          result = await this.fsExecutor.writeFile(
            request.workspaceId,
            request.inputParams.filePath,
            request.inputParams.content
          );
          break;

        case 'fs_list_dir':
          result = await this.fsExecutor.listDir(
            request.workspaceId,
            request.inputParams.directoryPath,
            request.inputParams.recursive
          );
          break;

        case 'fs_search':
          result = await this.fsExecutor.search(
            request.workspaceId,
            request.inputParams.query,
            request.inputParams.filePattern
          );
          break;

        case 'git_status':
          result = await this.gitExecutor.getStatus(request.workspaceId);
          break;

        case 'git_diff':
          result = await this.gitExecutor.getDiff(request.workspaceId, request.inputParams.targetBranch);
          break;

        case 'git_commit':
          result = await this.gitExecutor.commit(
            request.workspaceId,
            request.inputParams.message,
            request.inputParams.files
          );
          break;

        case 'terminal_run_command':
          result = await this.processExecutor.executeCommand(
            request.workspaceId,
            request.inputParams.command,
            request.inputParams.timeoutMs
          );
          break;

        default:
          throw new Error(`Unsupported tool: ${request.toolId}`);
      }

      if (request.idempotencyKey) {
        this.executedIdempotencyKeys.add(request.idempotencyKey);
      }

      return {
        jobId: request.jobId,
        success: true,
        result,
        durationMs: Date.now() - startTime
      };
    } catch (err: any) {
      return {
        jobId: request.jobId,
        success: false,
        error: err.message,
        durationMs: Date.now() - startTime
      };
    }
  }
}
