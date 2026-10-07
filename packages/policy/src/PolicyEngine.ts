import crypto from 'crypto';
import { ActionType, ApprovalRequest, ExecutionContract, ApprovalMode } from '@gideon/shared';
import { RiskEngine, ActionContext, RiskEvaluationResult } from './RiskEngine';
import { SecretProtection } from './SecretProtection';
import { CommandPolicy } from './CommandPolicy';

export class PolicyEngine {
  private secretKey: string;

  constructor(secretKey?: string) {
    const key = secretKey || process.env.HMAC_PLAN_SECRET;
    if (!key) {
      throw new Error('Security Violation: HMAC_PLAN_SECRET is required. Default fallback secrets are disabled.');
    }
    this.secretKey = key;
  }

  public evaluate(context: ActionContext): RiskEvaluationResult {
    return RiskEngine.evaluateAction(context);
  }

  public evaluateCommandRisk(
    actionType: string,
    agentId: string = 'system',
    params?: Record<string, any>
  ): { riskLevel: string; requiresApproval: boolean; approvalMode: string } {
    const isOutboundOrDeploy = 
      actionType.includes('send') || 
      actionType.includes('proposal') || 
      actionType.includes('deploy') || 
      actionType.includes('pay') ||
      actionType.includes('outreach');

    if (isOutboundOrDeploy) {
      return {
        riskLevel: 'CRITICAL',
        requiresApproval: true,
        approvalMode: 'ALWAYS_ASK'
      };
    }
    return {
      riskLevel: 'LOW',
      requiresApproval: false,
      approvalMode: 'AUTO'
    };
  }

  public generateAuthorizationHash(payload: {
    agentId: string;
    workspaceId: string;
    toolId: string;
    params: Record<string, any>;
    expiresAt: string;
    baseCommit?: string;
  }): string {
    const dataString = `${payload.agentId}|${payload.workspaceId}|${payload.toolId}|${JSON.stringify(payload.params)}|${payload.expiresAt}|${payload.baseCommit || ''}`;
    return crypto.createHmac('sha256', this.secretKey).update(dataString).digest('hex');
  }

  public verifyAuthorizationHash(
    payload: {
      agentId: string;
      workspaceId: string;
      toolId: string;
      params: Record<string, any>;
      expiresAt: string;
      baseCommit?: string;
    },
    providedHash?: string
  ): boolean {
    if (!providedHash) return false;

    // Check expiration
    if (new Date(payload.expiresAt).getTime() < Date.now()) {
      return false;
    }

    const computedHash = this.generateAuthorizationHash(payload);
    try {
      return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(providedHash));
    } catch {
      return false;
    }
  }

  public generateExecutionContract(contract: Omit<ExecutionContract, 'contractHash' | 'createdAt'>): ExecutionContract {
    const createdAt = new Date().toISOString();
    const dataString = `${contract.taskId}|${contract.workspaceId}|${contract.runnerId}|${contract.allowedPaths.sort().join(',')}|${contract.allowedTools.sort().join(',')}|${contract.allowedCommands.sort().join(',')}|${contract.maxCost}|${contract.expiresAt}`;
    const contractHash = crypto.createHmac('sha256', this.secretKey).update(dataString).digest('hex');

    return {
      ...contract,
      contractHash,
      createdAt
    };
  }

  public verifyExecutionContract(contract: ExecutionContract): boolean {
    if (new Date(contract.expiresAt).getTime() < Date.now()) {
      return false;
    }

    const dataString = `${contract.taskId}|${contract.workspaceId}|${contract.runnerId}|${contract.allowedPaths.sort().join(',')}|${contract.allowedTools.sort().join(',')}|${contract.allowedCommands.sort().join(',')}|${contract.maxCost}|${contract.expiresAt}`;
    const expectedHash = crypto.createHmac('sha256', this.secretKey).update(dataString).digest('hex');
    
    try {
      return crypto.timingSafeEqual(Buffer.from(expectedHash), Buffer.from(contract.contractHash));
    } catch {
      return false;
    }
  }
}

export { RiskEngine, SecretProtection, CommandPolicy };
