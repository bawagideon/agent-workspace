import fs from 'fs';
import path from 'path';
import { ToolRegistry } from '@gideon/tools';
import { PolicyEngine } from '@gideon/policy';
import { WorkspaceSandbox } from './sandbox/WorkspaceSandbox';
import { FsExecutor } from './executors/FsExecutor';
import { ProcessExecutor } from './executors/ProcessExecutor';
import { GitExecutor } from './executors/GitExecutor';
import { KillSwitch } from './KillSwitch';
import { ExecutionContract, ProjectContextPack, ContextTargetAgent } from '@gideon/shared';
import { ProjectContextPackBuilder, ProjectDataSource } from '@gideon/memory';
import { OpenClawBridgeClient } from './OpenClawBridgeClient';
import { EvidenceStore } from './EvidenceStore';
import type { FinancialControlPlane } from '../../billing/src';

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
  contract?: ExecutionContract;
  projectId?: string;
  contextPack?: ProjectContextPack;
  estimatedCostCents?: number;
}

export interface ExecutionJobResponse {
  jobId: string;
  success: boolean;
  result?: any;
  error?: string;
  durationMs: number;
  contextPack?: ProjectContextPack;
}

export class JobExecutor {
  private fsExecutor: FsExecutor;
  private processExecutor: ProcessExecutor;
  private gitExecutor: GitExecutor;
  private openClawBridge: OpenClawBridgeClient;
  private dataSource?: ProjectDataSource;
  private financialControlPlane?: FinancialControlPlane;
  private static persistentTokenStorePath = path.resolve(process.cwd(), '.gideon', 'consumed_tokens.json');

  constructor(
    private sandbox: WorkspaceSandbox,
    private policyEngine: PolicyEngine,
    openClawBridge?: OpenClawBridgeClient,
    dataSource?: ProjectDataSource,
    financialControlPlane?: FinancialControlPlane
  ) {
    this.fsExecutor = new FsExecutor(sandbox);
    this.processExecutor = new ProcessExecutor(sandbox);
    this.gitExecutor = new GitExecutor(this.processExecutor);
    this.openClawBridge = openClawBridge || new OpenClawBridgeClient();
    this.dataSource = dataSource;
    this.financialControlPlane = financialControlPlane;
  }

  public setFinancialControlPlane(fcp: FinancialControlPlane): void {
    this.financialControlPlane = fcp;
  }

  public getFinancialControlPlane(): FinancialControlPlane | undefined {
    return this.financialControlPlane;
  }

  public setDataSource(dataSource: ProjectDataSource): void {
    this.dataSource = dataSource;
  }

  public getDataSource(): ProjectDataSource | undefined {
    return this.dataSource;
  }

  public static formatContextPreamble(pack: ProjectContextPack): string {
    return [
      '<!-- GIDEON CONTEXT PACK INJECTION: BEGIN -->',
      `# GIDEON AI HQ — CONTEXT PACK [Agent: ${pack.targetAgent.toUpperCase()} | Rev: #${pack.projectRevision}]`,
      `## 1. Project Identity: ${pack.projectIdentity.name} (${pack.projectIdentity.slug})`,
      `   Category: ${pack.projectIdentity.category} | Version: ${pack.projectIdentity.currentVersion}`,
      `   Objective: ${pack.projectIdentity.businessObjective}`,
      `## 2. History & Missions: ${pack.history.completedMissionsCount} completed missions | Audit status: ${pack.history.recentTestStatus}`,
      `## 3. Current State: Status: ${pack.currentState.status} | Rev: #${pack.currentState.revision}`,
      `## 4. Decision Rationale: ${pack.decisionRationale.actionRecommendation} (Confidence: ${pack.decisionRationale.decisionConfidence})`,
      `## 5. Evidence & Audits: ${pack.evidence.evidenceIds.length} evidence records linked | Test artifacts: ${pack.evidence.testArtifactIds.length}`,
      `## 6. Constraints: Working directory: ${pack.constraints.workingDirectory} | Zero Outbound: ${pack.constraints.zeroOutboundEnforced} | Budget: $${(pack.constraints.budgetLimitCents / 100).toFixed(2)}`,
      `## 7. Next Agent Brief: Deliverable: ${pack.nextAgentBrief.expectedDeliverable}`,
      `## 8. Inaccessible Information (Firewall): Masked: [${pack.inaccessibleInformation.inaccessibleCategories.join(', ') || 'None'}] - Reason: ${pack.inaccessibleInformation.policyReason}`,
      '<!-- GIDEON CONTEXT PACK INJECTION: END -->'
    ].join('\n');
  }

  public async resolveContextPack(request: ExecutionJobRequest): Promise<ProjectContextPack | undefined> {
    const projectId = request.projectId || request.inputParams?.projectId;
    if (!projectId || !this.dataSource) {
      return request.contextPack;
    }

    const targetAgentRaw = (request.inputParams?.agentId || request.agentId || 'forge').toLowerCase();
    const targetAgent: ContextTargetAgent = (['forge', 'scout', 'sentinel'].includes(targetAgentRaw) ? targetAgentRaw : 'forge') as ContextTargetAgent;

    const project = await this.dataSource.getProjectById(projectId);
    if (!project) {
      return request.contextPack;
    }

    // If pack is already attached to request, verify its freshness
    if (request.contextPack) {
      const freshness = ProjectContextPackBuilder.verifyFreshness(request.contextPack, project.revision);
      if (freshness.isCurrent) {
        return request.contextPack;
      }
      // Stale pack detected: re-project fresh context
    }

    const builder = new ProjectContextPackBuilder(this.dataSource);
    return await builder.buildPack(projectId, targetAgent);
  }

  private static isTokenConsumed(tokenSignature: string): boolean {
    try {
      if (fs.existsSync(JobExecutor.persistentTokenStorePath)) {
        const data = JSON.parse(fs.readFileSync(JobExecutor.persistentTokenStorePath, 'utf8'));
        return Array.isArray(data) && data.includes(tokenSignature);
      }
    } catch {
      // Fallback
    }
    return false;
  }

  private static markTokenConsumed(tokenSignature: string): void {
    try {
      const dir = path.dirname(JobExecutor.persistentTokenStorePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      let list: string[] = [];
      if (fs.existsSync(JobExecutor.persistentTokenStorePath)) {
        list = JSON.parse(fs.readFileSync(JobExecutor.persistentTokenStorePath, 'utf8'));
      }
      if (!list.includes(tokenSignature)) {
        list.push(tokenSignature);
        fs.writeFileSync(JobExecutor.persistentTokenStorePath, JSON.stringify(list, null, 2), 'utf8');
      }
    } catch {
      // Fallback
    }
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

    // 0. Financial Rule of Iron Pre-Flight Gate & Atomic Spend Reservation
    let reservationId: string | undefined;
    if (this.financialControlPlane && request.projectId) {
      try {
        const reservationAmount = request.estimatedCostCents || 50; // default 50 cents
        const res = await this.financialControlPlane.reserveSpend(
          request.projectId,
          reservationAmount,
          `Execution of ${request.toolId} for ${request.agentId}`,
          { taskId: request.taskId, agentId: request.agentId }
        );
        reservationId = res.id;
      } catch (err: any) {
        return {
          jobId: request.jobId,
          success: false,
          error: `Financial Gate Violation: ${err.message}`,
          durationMs: Date.now() - startTime
        };
      }
    }

    // Ensure workspaceId is populated on inputParams if present on request
    if (request.inputParams && !request.inputParams.workspaceId && request.workspaceId) {
      request.inputParams.workspaceId = request.workspaceId;
    }

    // 1. Tool validation
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

    // 2. Strict Cryptographic Authorization & Restart-Safe Replay Protection for Medium/High/Critical tools
    if (tool.defaultRiskLevel !== 'LOW') {
      if (!request.authorizationHash || !request.expiresAt) {
        return {
          jobId: request.jobId,
          success: false,
          error: `Security Violation: Tool '${request.toolId}' requires a valid authorizationHash and expiresAt token.`,
          durationMs: Date.now() - startTime
        };
      }

      // Replay Detection: Check if authorization token was already consumed (Persistent store across restarts)
      const tokenSignature = `${request.authorizationHash}:${request.stepId || request.jobId || 'root'}`;
      if (JobExecutor.isTokenConsumed(tokenSignature)) {
        return {
          jobId: request.jobId,
          success: false,
          error: 'Security Violation: Authorization token has already been consumed (Token Replay Rejected).',
          durationMs: Date.now() - startTime
        };
      }

      const isValid = this.policyEngine.verifyAuthorizationHash(
        {
          agentId: request.agentId,
          workspaceId: request.workspaceId,
          toolId: request.toolId,
          params: request.inputParams,
          expiresAt: request.expiresAt
        },
        request.authorizationHash
      );

      if (!isValid) {
        return {
          jobId: request.jobId,
          success: false,
          error: `Security Violation: Invalid or expired authorization hash for tool '${request.toolId}'. Execution aborted.`,
          durationMs: Date.now() - startTime
        };
      }

      // Atomically consume authorization token persistently
      JobExecutor.markTokenConsumed(tokenSignature);
    }

    // 3. Execution Contract Scope Enforcement (if provided)
    if (request.contract) {
      const contractValid = this.policyEngine.verifyExecutionContract(request.contract);
      if (!contractValid) {
        return {
          jobId: request.jobId,
          success: false,
          error: 'Security Violation: Execution Contract signature invalid or expired.',
          durationMs: Date.now() - startTime
        };
      }

      if (request.inputParams.filePath && !request.contract.allowedPaths.includes(request.inputParams.filePath)) {
        return {
          jobId: request.jobId,
          success: false,
          error: `Security Violation: Target path '${request.inputParams.filePath}' is outside Execution Contract scope.`,
          durationMs: Date.now() - startTime
        };
      }
    }

    // 4. Resolve / Refresh Context Pack if applicable
    const activePack = await this.resolveContextPack(request);
    if (activePack) {
      request.contextPack = activePack;
    }

    // 5. Runtime Boundary Enforcement: Filesystem Project Sandbox
    // Context Injection != Sandbox Enforcement. Physical boundary is strictly enforced here.
    if (request.contextPack?.constraints?.workingDirectory) {
      const projectWorkingDir = path.normalize(request.contextPack.constraints.workingDirectory).replace(/^[/\\]+/, '');
      const targetPath = request.inputParams?.filePath || request.inputParams?.directoryPath;
      if (targetPath) {
        const normalizedTarget = path.normalize(targetPath).replace(/^[/\\]+/, '');
        const pNorm = projectWorkingDir.replace(/\\/g, '/');
        const tNorm = normalizedTarget.replace(/\\/g, '/');

        const isWithin = tNorm === pNorm || tNorm.startsWith(pNorm + '/');
        if (!isWithin) {
          return {
            jobId: request.jobId,
            success: false,
            error: `Security Violation: Target path '${targetPath}' is outside project working directory '${request.contextPack.constraints.workingDirectory}'. Traversal blocked.`,
            durationMs: Date.now() - startTime
          };
        }
      }
    }

    // 6. Runtime Boundary Enforcement: Zero-Outbound Network Boundary
    if (request.contextPack?.constraints?.zeroOutboundEnforced) {
      const isOutboundTool = 
        request.toolId.includes('email') || 
        request.toolId.includes('webhook') || 
        request.toolId.includes('stripe') || 
        request.toolId.includes('slack') ||
        request.toolId.includes('outbound') ||
        (request.toolId === 'openclaw_tool_invoke' && ['http_request', 'email_send', 'webhook_post', 'stripe_charge', 'slack_post', 'send_message'].includes(request.inputParams?.toolName));

      if (isOutboundTool) {
        return {
          jobId: request.jobId,
          success: false,
          error: 'Security Violation: Outbound external communication blocked by zero-outbound policy enforcement.',
          durationMs: Date.now() - startTime
        };
      }

      if (request.toolId === 'terminal_run_command' && request.inputParams?.command) {
        const cmd = request.inputParams.command.toLowerCase();
        if (/\b(curl|wget|nc|ncat|ssh|scp|ftp|telnet)\b/.test(cmd)) {
          return {
            jobId: request.jobId,
            success: false,
            error: 'Security Violation: Network egress command blocked by zero-outbound policy enforcement.',
            durationMs: Date.now() - startTime
          };
        }
      }
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

        case 'openclaw_tool_invoke':
          result = await this.openClawBridge.invokeTool(
            request.inputParams.toolName,
            request.inputParams.args || {},
            request.inputParams.sessionKey
          );
          break;

        case 'openclaw_agent_dispatch': {
          let prompt = request.inputParams.prompt;
          let injectedPreamble: string | undefined;
          if (request.contextPack) {
            injectedPreamble = JobExecutor.formatContextPreamble(request.contextPack);
            prompt = `${injectedPreamble}\n\n${prompt}`;
          }

          result = await this.openClawBridge.dispatchAgent({
            agentId: request.inputParams.agentId || request.agentId,
            prompt,
            sessionKey: request.inputParams.sessionKey || `agent:${request.agentId}:${request.taskId}`,
            model: request.inputParams.model,
            thinking: request.inputParams.thinking,
            cwd: this.sandbox.getWorkspaceRoot(request.workspaceId)
          });

          if (injectedPreamble) {
            result.injectedPreamble = injectedPreamble;
          }

          // Automatically record immutable evidence
          try {
            const evidenceId = `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            const evidence = EvidenceStore.saveEvidence({
              id: evidenceId,
              taskId: request.taskId,
              stepId: request.stepId,
              agentId: request.agentId,
              sessionKey: result.sessionKey || `agent:${request.agentId}:${request.taskId}`,
              runId: result.runId,
              model: result.model || 'unknown',
              toolNames: result.toolNames || [],
              toolArgs: request.inputParams,
              toolResult: result.reply,
              exitCode: result.ok ? 0 : 1,
              testPassed: result.ok,
              tokensUsed: result.tokensUsed || 0,
              costCents: result.costCents || 0,
              costUsd: result.costUsd || 0,
              timestamp: new Date().toISOString()
            });
            result.evidenceId = evidence.id;
            result.evidenceSignature = evidence.signature;
          } catch (evErr: any) {
            console.warn(`[JobExecutor] Failed to save evidence: ${evErr.message}`);
          }
          break;
        }

        default:
          throw new Error(`Unsupported tool: ${request.toolId}`);
      }

      if (reservationId && this.financialControlPlane) {
        try {
          const actualCostCents = result?.costCents !== undefined ? result.costCents : 10;
          await this.financialControlPlane.settleSpend(reservationId, actualCostCents, {
            tokenCount: result?.tokensUsed || 0,
            agentId: request.agentId,
            taskId: request.taskId,
            description: `Completed ${request.toolId}`
          });
        } catch (settleErr: any) {
          console.warn('[JobExecutor] Failed to settle spend reservation:', settleErr.message);
        }
      }

      return {
        jobId: request.jobId,
        success: true,
        result,
        contextPack: request.contextPack,
        durationMs: Date.now() - startTime
      };
    } catch (err: any) {
      if (reservationId && this.financialControlPlane) {
        try {
          await this.financialControlPlane.releaseReservation(reservationId, `Job failed: ${err.message}`);
        } catch (relErr: any) {
          console.warn('[JobExecutor] Failed to release spend reservation:', relErr.message);
        }
      }

      return {
        jobId: request.jobId,
        success: false,
        error: err.message,
        durationMs: Date.now() - startTime
      };
    }
  }
}
