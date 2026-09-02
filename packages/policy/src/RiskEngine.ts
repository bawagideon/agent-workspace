import { RiskLevel, ApprovalMode, ActionType } from '@gideon/shared';
import { SecretProtection } from './SecretProtection';
import { CommandPolicy } from './CommandPolicy';

export interface ActionContext {
  toolId: string;
  actionType: ActionType;
  targetPath?: string;
  command?: string;
  workspaceAccessMode: 'READ_ONLY' | 'READ_WRITE' | 'DISABLED';
  isConfigOrSecretFile?: boolean;
}

export interface RiskEvaluationResult {
  riskLevel: RiskLevel;
  approvalMode: ApprovalMode;
  isPermitted: boolean;
  reason: string;
  requiredConstraints?: {
    maxFiles?: number;
    allowedCommands?: string[];
  };
}

export class RiskEngine {
  public static evaluateAction(context: ActionContext): RiskEvaluationResult {
    // 1. Workspace mode check
    if (context.workspaceAccessMode === 'DISABLED') {
      return {
        riskLevel: 'CRITICAL',
        approvalMode: 'ALWAYS_ASK',
        isPermitted: false,
        reason: 'Workspace is disabled.'
      };
    }

    if (context.workspaceAccessMode === 'READ_ONLY' && context.actionType !== 'FILE_READ') {
      return {
        riskLevel: 'HIGH',
        approvalMode: 'ALWAYS_ASK',
        isPermitted: false,
        reason: 'Workspace is in READ_ONLY mode. Write mutations are forbidden.'
      };
    }

    // 2. Secret file check
    if (context.targetPath && SecretProtection.isSecretFile(context.targetPath)) {
      return {
        riskLevel: 'CRITICAL',
        approvalMode: 'ALWAYS_ASK',
        isPermitted: false,
        reason: 'Access to secret and environment configuration files is permanently denied.'
      };
    }

    // 3. Command execution policy
    if (context.command) {
      const cmdResult = CommandPolicy.evaluateCommand(context.command);
      if (!cmdResult.isAllowed) {
        return {
          riskLevel: 'CRITICAL',
          approvalMode: 'ALWAYS_ASK',
          isPermitted: false,
          reason: cmdResult.reason
        };
      }

      let approvalMode: ApprovalMode = 'AUTO';
      if (cmdResult.riskLevel === 'MEDIUM') approvalMode = 'PLAN';
      if (cmdResult.riskLevel === 'HIGH') approvalMode = 'SESSION';
      if (cmdResult.riskLevel === 'CRITICAL') approvalMode = 'ALWAYS_ASK';

      return {
        riskLevel: cmdResult.riskLevel,
        approvalMode,
        isPermitted: true,
        reason: cmdResult.reason
      };
    }

    // 4. File Read actions
    if (context.actionType === 'FILE_READ') {
      return {
        riskLevel: 'LOW',
        approvalMode: 'AUTO',
        isPermitted: true,
        reason: 'Safe read-only operation inside workspace.'
      };
    }

    // 5. File Write actions
    if (context.actionType === 'FILE_WRITE') {
      return {
        riskLevel: 'MEDIUM',
        approvalMode: 'PLAN',
        isPermitted: true,
        reason: 'Source code modification requires Plan Approval.'
      };
    }

    // 6. Git Push / Production Deploy
    if (context.actionType === 'GIT_PUSH' || context.actionType === 'DEPLOY') {
      return {
        riskLevel: 'CRITICAL',
        approvalMode: 'ALWAYS_ASK',
        isPermitted: true,
        reason: 'External mutation requires explicit single-action approval.'
      };
    }

    return {
      riskLevel: 'HIGH',
      approvalMode: 'ALWAYS_ASK',
      isPermitted: true,
      reason: 'General high-impact action.'
    };
  }
}
