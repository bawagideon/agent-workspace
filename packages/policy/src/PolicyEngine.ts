import crypto from 'crypto';
import { ActionType, ApprovalRequest } from '@gideon/shared';
import { RiskEngine, ActionContext, RiskEvaluationResult } from './RiskEngine';
import { SecretProtection } from './SecretProtection';
import { CommandPolicy } from './CommandPolicy';

export class PolicyEngine {
  private secretKey: string;

  constructor(secretKey: string = process.env.HMAC_PLAN_SECRET || 'gideon-default-secret-key') {
    this.secretKey = secretKey;
  }

  public evaluate(context: ActionContext): RiskEvaluationResult {
    return RiskEngine.evaluateAction(context);
  }

  public generateAuthorizationHash(payload: {
    agentId: string;
    workspaceId: string;
    toolId: string;
    params: Record<string, any>;
    expiresAt: string;
  }): string {
    const dataString = `${payload.agentId}|${payload.workspaceId}|${payload.toolId}|${JSON.stringify(payload.params)}|${payload.expiresAt}`;
    return crypto.createHmac('sha256', this.secretKey).update(dataString).digest('hex');
  }

  public verifyAuthorizationHash(
    payload: {
      agentId: string;
      workspaceId: string;
      toolId: string;
      params: Record<string, any>;
      expiresAt: string;
    },
    providedHash: string
  ): boolean {
    const computedHash = this.generateAuthorizationHash(payload);
    return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(providedHash));
  }
}

export { RiskEngine, SecretProtection, CommandPolicy };
