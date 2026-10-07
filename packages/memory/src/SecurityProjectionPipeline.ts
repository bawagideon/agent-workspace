import crypto from 'crypto';
import { 
  ProjectContextPack, 
  ContextTargetAgent, 
  AgentSecurityPolicy,
  ContextPackIdentity,
  ContextPackHistory,
  ContextPackCurrentState,
  ContextPackDecisionRationale,
  ContextPackEvidence,
  ContextPackConstraints,
  ContextPackNextAgentBrief,
  ContextPackInaccessibleInformation,
  VerifiedLesson,
  ProjectRecord,
  ProjectMissionLink,
  ProjectEvent,
  ProjectTestRun,
  ProjectExecutionProfile
} from '@gideon/shared';
import { canonicalStringify } from './ProjectContextPackBuilder';

export const FORBIDDEN_SECRET_PATTERNS = [
  /sk_live_[a-zA-Z0-9]+/i,
  /sk_test_[a-zA-Z0-9]+/i,
  /Bearer\s+[a-zA-Z0-9_\-\.]+/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
  /TEST_STRIPE_SECRET/i,
  /TEST_SUPABASE_SERVICE_KEY/i,
  /TEST_HMAC_SECRET/i,
  /TEST_GATEWAY_TOKEN/i,
  /ghp_[a-zA-Z0-9]{36}/i,
  /eyJ[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]{10,}/i // JWT pattern
];

/**
 * Declarative Agent Security Policies.
 * Principle of Least Privilege: Defines permitted and strictly forbidden domains/capabilities.
 */
export const AGENT_SECURITY_POLICIES: Record<ContextTargetAgent, AgentSecurityPolicy> = {
  forge: {
    targetAgent: 'forge',
    allowedDomains: ['PROJECT', 'TECHNICAL', 'WORK', 'MISSION'],
    allowedFields: [
      'id', 'slug', 'name', 'category', 'businessObjective', 'techStack',
      'currentVersion', 'workspacePath', 'executionProfile', 'recentTest',
      'completedMissions', 'verifiedLessons'
    ],
    forbiddenCategories: [
      'FINANCIAL_CREDENTIALS',
      'PAYOUT_DATA',
      'FINANCE_BALANCES',
      'STRIPE_SECRET_KEY',
      'CROSS_PROJECT_DATA',
      'OUTBOUND_CHANNELS',
      'CUSTOMER_BILLING_DATA'
    ],
    forbiddenCapabilities: [
      'TRANSFER_FUNDS',
      'MUTATE_EXTERNAL_PROJECTS',
      'SEND_UNAPPROVED_OUTBOUND'
    ],
    policyReason: 'Engineering execution boundary (Zero Financial / Cross-Project Ingress)'
  },
  scout: {
    targetAgent: 'scout',
    allowedDomains: ['PROJECT', 'BUSINESS', 'LESSONS'],
    allowedFields: [
      'id', 'slug', 'name', 'category', 'businessObjective', 'targetCustomer',
      'problemSolved', 'publicPricing', 'marketLessons', 'completedMissions'
    ],
    forbiddenCategories: [
      'SOURCE_CODE_WRITE',
      'SHELL_EXECUTION',
      'DEPLOYMENT_CREDENTIALS',
      'DATABASE_SERVICE_KEYS',
      'INTERNAL_SECRETS',
      'CROSS_PROJECT_DATA'
    ],
    forbiddenCapabilities: [
      'WRITE_SOURCE_CODE',
      'EXECUTE_SHELL_COMMANDS',
      'DEPLOY_PRODUCTION'
    ],
    policyReason: 'Market intelligence boundary (Zero Code Mutation / Shell Execution)'
  },
  sentinel: {
    targetAgent: 'sentinel',
    allowedDomains: ['PROJECT', 'TECHNICAL', 'MISSION', 'LESSONS'],
    allowedFields: [
      'id', 'slug', 'name', 'category', 'businessObjective', 'techStack',
      'workspacePath', 'executionProfile', 'testRuns', 'recentTest',
      'auditEvents', 'evidenceRecords', 'verifiedLessons'
    ],
    forbiddenCategories: [
      'FINANCIAL_TRANSFER_KEYS',
      'CUSTOMER_PRIVATE_BILLING',
      'OUTBOUND_CHANNELS',
      'CROSS_PROJECT_DATA'
    ],
    forbiddenCapabilities: [
      'INITIATE_PAYOUTS',
      'SEND_OUTBOUND_COMMUNICATIONS'
    ],
    policyReason: 'Adversarial QA boundary (Independent Verification / Audit Only)'
  }
};

export class SecurityPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityPolicyError';
  }
}

/**
 * Security Projection Pipeline for Gideon AI HQ.
 * 
 * Invariants:
 * 1. Policy-First Field Selection: Forbidden fields are never even selected or placed into intermediate projection objects.
 * 2. Agent Domain Isolation: Forge != Scout != Sentinel. Each agent sees only its authorized perspective.
 * 3. Deep Defense-in-Depth Sanitization: Recursively checks payloads for high-entropy secrets and scrubs them.
 * 4. Transparent Inaccessibility Disclosure: Question 8 documents categories and reasons without leaking secret values or names.
 * 5. Cross-Project Isolation: Project A context strictly excludes Project B data.
 * 6. Dual State Hashing: Tracks authoritativeStateHash and projectedContextHash deterministically.
 * 7. Fail Closed: Unknown agents or unclassifiable structures throw SecurityPolicyError.
 */
export class SecurityProjectionPipeline {

  /**
   * Resolve and validate policy for target agent. Fails closed.
   */
  public static getPolicy(targetAgent: ContextTargetAgent): AgentSecurityPolicy {
    if (!targetAgent || !AGENT_SECURITY_POLICIES[targetAgent]) {
      throw new SecurityPolicyError(`Security Violation: Unsupported target agent '${targetAgent}'. Fail-closed policy enforced.`);
    }
    return AGENT_SECURITY_POLICIES[targetAgent];
  }

  /**
   * Policy-First Construction: Project Identity.
   * Only selects permitted fields based on agent policy.
   */
  public static projectIdentity(
    project: ProjectRecord, 
    policy: AgentSecurityPolicy
  ): ContextPackIdentity {
    const rawMeta = project.metadata || {};

    // Policy-first field selection: forbidden fields are never extracted
    const techStack = policy.allowedFields.includes('techStack') 
      ? (Array.isArray(rawMeta.techStack) ? [...rawMeta.techStack] : [])
      : [];

    const targetCustomer = policy.allowedFields.includes('targetCustomer')
      ? (project.targetCustomer || undefined)
      : undefined;

    const problemSolved = policy.allowedFields.includes('problemSolved')
      ? (project.problemSolved || undefined)
      : undefined;

    return {
      id: project.id,
      slug: project.slug,
      name: project.name,
      category: project.category,
      businessObjective: project.businessObjective,
      targetCustomer,
      problemSolved,
      techStack,
      currentVersion: project.currentVersion
    };
  }

  /**
   * Policy-First Construction: Constraints.
   * Configures execution boundaries per agent persona.
   */
  public static projectConstraints(
    project: ProjectRecord,
    profile: ProjectExecutionProfile | null,
    policy: AgentSecurityPolicy
  ): ContextPackConstraints {
    // Forge gets technical command execution profiles
    if (policy.targetAgent === 'forge') {
      return {
        allowedStartCommand: profile?.allowedStartCommand || undefined,
        allowedTestCommands: profile?.allowedTestCommands || [],
        workingDirectory: profile?.workingDirectory || project.workspacePath,
        resourceLimits: profile?.resourceLimits || { maxMemoryMb: 512, timeoutMs: 30000 },
        zeroOutboundEnforced: true,
        financialRuleOfIronEnforced: true,
        budgetLimitCents: 200 // $2.00 worker cap
      };
    }

    // Sentinel gets audit and test constraints
    if (policy.targetAgent === 'sentinel') {
      return {
        allowedStartCommand: undefined, // Sentinel audits, does not start service
        allowedTestCommands: profile?.allowedTestCommands || [],
        workingDirectory: profile?.workingDirectory || project.workspacePath,
        resourceLimits: profile?.resourceLimits || { maxMemoryMb: 512, timeoutMs: 30000 },
        zeroOutboundEnforced: true,
        financialRuleOfIronEnforced: true,
        budgetLimitCents: 100 // $1.00 QA cap
      };
    }

    // Scout gets market research boundaries (zero shell commands, zero write)
    return {
      allowedStartCommand: undefined,
      allowedTestCommands: [],
      workingDirectory: 'sandbox/research',
      resourceLimits: { maxMemoryMb: 256, timeoutMs: 15000 },
      zeroOutboundEnforced: true,
      financialRuleOfIronEnforced: true,
      budgetLimitCents: 50
    };
  }

  /**
   * Cross-Project Isolation Check.
   * Ensures no foreign project data enters this project's context pack.
   */
  public static enforceCrossProjectIsolation(
    projectId: string,
    missions: ProjectMissionLink[],
    events: ProjectEvent[],
    testRuns: ProjectTestRun[]
  ): {
    cleanMissions: ProjectMissionLink[];
    cleanEvents: ProjectEvent[];
    cleanTestRuns: ProjectTestRun[];
  } {
    const cleanMissions = missions.filter(m => m.projectId === projectId);
    const cleanEvents = events.filter(e => e.projectId === projectId);
    const cleanTestRuns = testRuns.filter(t => t.projectId === projectId);

    return { cleanMissions, cleanEvents, cleanTestRuns };
  }

  /**
   * Question 8: Transparent Inaccessibility Disclosure.
   * Explains categories and reasons without leaking secrets or implementation names.
   */
  public static buildInaccessibleInformation(
    policy: AgentSecurityPolicy,
    customBlockedProjects: string[] = []
  ): ContextPackInaccessibleInformation {
    const domainFirewallRules: string[] = [];

    if (policy.forbiddenCategories.includes('FINANCIAL_CREDENTIALS')) {
      domainFirewallRules.push('FINANCE domain excluded under Principle of Least Privilege');
    }
    if (policy.forbiddenCategories.includes('OUTBOUND_CHANNELS')) {
      domainFirewallRules.push('Outbound communication channels forbidden (Human-in-the-Loop Gate)');
    }
    if (policy.forbiddenCategories.includes('SOURCE_CODE_WRITE')) {
      domainFirewallRules.push('Source code write and mutation access forbidden');
    }
    if (policy.forbiddenCategories.includes('SHELL_EXECUTION')) {
      domainFirewallRules.push('Direct shell command execution forbidden');
    }
    if (policy.forbiddenCategories.includes('CROSS_PROJECT_DATA')) {
      domainFirewallRules.push('Cross-project access blocked (Strict Project Isolation)');
    }

    const inaccessibleCategories = [...policy.forbiddenCategories];
    const redactedKeys = [...policy.forbiddenCategories]; // backward compat
    const inaccessibleProjects = [
      'projects/* (cross-project containment enforced)',
      ...customBlockedProjects
    ];

    return {
      domainFirewallRules,
      inaccessibleCategories,
      redactedKeys,
      inaccessibleProjects,
      forbiddenCapabilities: [...policy.forbiddenCapabilities],
      policyReason: policy.policyReason
    };
  }

  /**
   * Defense-in-Depth Sanitizer.
   * Recursively inspects data to verify no secret patterns escaped policy-first selection.
   */
  public static sanitizeDefenseInDepth<T>(payload: T, strict: boolean = true): T {
    if (payload === null || payload === undefined) {
      return payload;
    }

    if (typeof payload === 'string') {
      let sanitizedStr: string = payload;
      for (const pattern of FORBIDDEN_SECRET_PATTERNS) {
        if (pattern.test(sanitizedStr)) {
          if (strict) {
            throw new SecurityPolicyError(
              `Security Violation: Defense-in-depth detected forbidden secret pattern ${pattern}. Payload rejected.`
            );
          } else {
            sanitizedStr = sanitizedStr.replace(pattern, '[REDACTED_SECRET]');
          }
        }
      }
      return sanitizedStr as unknown as T;
    }

    if (Array.isArray(payload)) {
      return payload.map(item => this.sanitizeDefenseInDepth(item, strict)) as unknown as T;
    }

    if (typeof payload === 'object') {
      const sanitizedObj: Record<string, any> = {};
      for (const [key, value] of Object.entries(payload)) {
        // Redact any property whose key itself indicates a sensitive credential
        if (/secret|token|password|credential|private_key|api_key/i.test(key)) {
          if (strict) {
            throw new SecurityPolicyError(
              `Security Violation: Sensitive property key '${key}' detected in projection. Defense-in-depth rejected payload.`
            );
          }
          sanitizedObj[key] = '[REDACTED_SECRET]';
          continue;
        }
        sanitizedObj[key] = this.sanitizeDefenseInDepth(value, strict);
      }
      return sanitizedObj as T;
    }

    return payload;
  }

  /**
   * Deterministic State Hash Calculation.
   * Computes both authoritativeStateHash and projectedContextHash.
   */
  public static computeHashes(
    authoritativeSnapshot: any,
    projectedContext: any
  ): { authoritativeStateHash: string; projectedContextHash: string } {
    const authCanonical = canonicalStringify(authoritativeSnapshot);
    const projCanonical = canonicalStringify(projectedContext);

    const authoritativeStateHash = crypto.createHash('sha256').update(authCanonical).digest('hex');
    const projectedContextHash = crypto.createHash('sha256').update(projCanonical).digest('hex');

    return { authoritativeStateHash, projectedContextHash };
  }
}
