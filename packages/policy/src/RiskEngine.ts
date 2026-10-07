import { RiskLevel, ApprovalMode, ActionType, WorkspaceType } from '@gideon/shared';
import { SecretProtection } from './SecretProtection';
import { CommandPolicy } from './CommandPolicy';

export interface ActionContext {
  toolId: string;
  actionType: ActionType;
  targetPath?: string;
  command?: string;
  workspaceAccessMode: 'READ_ONLY' | 'READ_WRITE' | 'DISABLED';
  workspaceType?: WorkspaceType;
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
    // 1. Immutable REFERENCE Workspace Protection (e.g. yt-automation)
    if (context.workspaceType === 'REFERENCE' && context.actionType !== 'FILE_READ') {
      return {
        riskLevel: 'CRITICAL',
        approvalMode: 'ALWAYS_ASK',
        isPermitted: false,
        reason: 'Security Violation: Workspace is an immutable REFERENCE repository. All mutations are permanently forbidden.'
      };
    }

    // 2. Workspace Access Mode Check
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

    // 3. Secret and Config File Protection
    if (context.targetPath && SecretProtection.isSecretFile(context.targetPath)) {
      return {
        riskLevel: 'CRITICAL',
        approvalMode: 'ALWAYS_ASK',
        isPermitted: false,
        reason: 'Access to secret and environment configuration files is permanently denied.'
      };
    }

    // 4. Command Execution Policy
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

    // 5. File Read Actions
    if (context.actionType === 'FILE_READ') {
      return {
        riskLevel: 'LOW',
        approvalMode: 'AUTO',
        isPermitted: true,
        reason: 'Safe read-only operation inside workspace.'
      };
    }

    // 6. File Write Actions
    if (context.actionType === 'FILE_WRITE') {
      return {
        riskLevel: 'MEDIUM',
        approvalMode: 'PLAN',
        isPermitted: true,
        reason: 'Source code modification requires Plan Approval.'
      };
    }

    // 7. OpenClaw Tool Invocation & Agent Dispatch
    if (context.toolId === 'openclaw_agent_dispatch') {
      return {
        riskLevel: 'MEDIUM',
        approvalMode: 'PLAN',
        isPermitted: true,
        reason: 'Autonomous OpenClaw agent execution requires Plan/Session approval.'
      };
    }

    if (context.toolId === 'openclaw_tool_invoke') {
      // Outbound communication and messaging tools require ALWAYS_ASK human approval
      const highRiskTools = ['sessions_send', 'channel_post', 'email_send', 'outreach'];
      if (highRiskTools.includes(context.targetPath || '')) {
        return {
          riskLevel: 'CRITICAL',
          approvalMode: 'ALWAYS_ASK',
          isPermitted: true,
          reason: 'External messaging or outreach requires mandatory ALWAYS_ASK human approval.'
        };
      }
      return {
        riskLevel: 'MEDIUM',
        approvalMode: 'PLAN',
        isPermitted: true,
        reason: 'OpenClaw tool execution operates under Plan approval.'
      };
    }

    // 8. Git Push / Production Deploy
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
