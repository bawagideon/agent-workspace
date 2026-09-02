import { RiskLevel } from '@gideon/shared';

export class CommandPolicy {
  private static AUTO_ALLOWED_COMMANDS = [
    /^npm (?:test|run test|run build|run lint|run typecheck)(?:\s.*)?$/,
    /^pnpm (?:test|run test|run build|run lint|run typecheck)(?:\s.*)?$/,
    /^yarn (?:test|build|lint|typecheck)(?:\s.*)?$/,
    /^npx tsc(?: --noEmit)?$/,
    /^git (?:status|diff|log|branch)(?:\s.*)?$/
  ];

  private static BLOCKED_COMMANDS = [
    /\brm\s+-rf\b/i,
    /\bformat\b/i,
    /\bdd\b/i,
    /\bdel\s+\/f\s+\/s\s+\/q\b/i,
    /\bshutdown\b/i
  ];

  public static evaluateCommand(command: string): { isAllowed: boolean; riskLevel: RiskLevel; reason: string } {
    const trimmed = command.trim();

    // 1. Check dangerous blacklist
    for (const blocked of this.BLOCKED_COMMANDS) {
      if (blocked.test(trimmed)) {
        return {
          isAllowed: false,
          riskLevel: 'CRITICAL',
          reason: 'Command contains dangerous destructive operations.'
        };
      }
    }

    // 2. Check auto-allowed list
    for (const allowed of this.AUTO_ALLOWED_COMMANDS) {
      if (allowed.test(trimmed)) {
        return {
          isAllowed: true,
          riskLevel: 'LOW',
          reason: 'Command is explicitly allowlisted for safe verification.'
        };
      }
    }

    // 3. Git commit / branch commands
    if (/^git (?:checkout|add|commit)(?:\s.*)?$/.test(trimmed)) {
      return {
        isAllowed: true,
        riskLevel: 'MEDIUM',
        reason: 'Local repository mutation requires Plan/Session approval.'
      };
    }

    // 4. Git push / deploy / network
    if (/^git push(?:\s.*)?$/.test(trimmed) || /^vercel(?:\s.*)?$/.test(trimmed)) {
      return {
        isAllowed: true,
        riskLevel: 'CRITICAL',
        reason: 'External mutation command requires explicit Always-Ask approval.'
      };
    }

    // 5. Default fallback
    return {
      isAllowed: true,
      riskLevel: 'HIGH',
      reason: 'Non-allowlisted command requires approval.'
    };
  }
}
