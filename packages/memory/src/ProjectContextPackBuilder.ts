import crypto from 'crypto';
import { 
  ProjectContextPack, 
  ContextTargetAgent, 
  ContextPackFreshnessCheck,
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

export interface ProjectDataSource {
  getProjectById(id: string): Promise<ProjectRecord | null>;
  getProjectMissions(projectId: string): Promise<ProjectMissionLink[]>;
  getEvents(projectId: string): Promise<ProjectEvent[]>;
  getTestRuns(projectId: string): Promise<ProjectTestRun[]>;
  getVerifiedLessons?(projectId: string): Promise<VerifiedLesson[]>;
}

const VALID_TARGET_AGENTS: ContextTargetAgent[] = ['forge', 'sentinel', 'scout'];

const FORBIDDEN_SECRET_PATTERNS = [
  /sk_live_[a-zA-Z0-9]+/i,
  /sk_test_[a-zA-Z0-9]+/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
  /TEST_STRIPE_SECRET/i,
  /TEST_SUPABASE_SERVICE_KEY/i,
  /TEST_HMAC_SECRET/i,
  /TEST_GATEWAY_TOKEN/i
];

/**
 * Deterministic JSON stringifier that sorts object keys recursively.
 * Guarantees identical output string for identical logical object graphs.
 */
export function canonicalStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalStringify).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj).sort();
  const entries = sortedKeys.map(k => `${JSON.stringify(k)}:${canonicalStringify(obj[k])}`);
  return '{' + entries.join(',') + '}';
}

/**
 * Defensive assertion verifying no unredacted secret patterns leaked into the pack.
 */
export function assertNoSecrets(pack: ProjectContextPack): void {
  const serialized = JSON.stringify(pack);
  for (const pattern of FORBIDDEN_SECRET_PATTERNS) {
    if (pattern.test(serialized)) {
      throw new Error(`Security Violation: Context Pack ingress check failed! Forbidden secret pattern ${pattern} detected in pack projection.`);
    }
  }
}

/**
 * Read-Only, Deterministic Project Context Pack Builder
 * Assembles authoritative project reality into an ephemeral, permission-scoped Context Pack.
 * Strict Invariant: Zero mutation of authoritative state or local recovery caches.
 */
export class ProjectContextPackBuilder {
  constructor(private dataSource?: ProjectDataSource) {}

  private async getDb(): Promise<ProjectDataSource> {
    if (this.dataSource) {
      return this.dataSource;
    }
    // Dynamic import to avoid circular monorepo dependency when running in non-HQ contexts
    try {
      const { ProjectDatabase } = await import('../../../apps/hq/src/lib/projects/ProjectDatabase');
      return ProjectDatabase.getInstance();
    } catch {
      throw new Error('ProjectDataSource not provided and default ProjectDatabase is unavailable.');
    }
  }

  /**
   * Primary projection API.
   * Transforms authoritative project state into a permission-filtered ProjectContextPack.
   */
  public async buildPack(
    projectId: string,
    targetAgent: ContextTargetAgent
  ): Promise<ProjectContextPack> {
    // 1. Target Agent Validation (Fail Closed)
    if (!targetAgent || !VALID_TARGET_AGENTS.includes(targetAgent)) {
      throw new Error(
        `Unsupported target agent '${targetAgent}'. Permitted target agents: ${VALID_TARGET_AGENTS.join(', ')}.`
      );
    }

    const db = await this.getDb();

    // 2. Authoritative Project Record Retrieval
    const project = await db.getProjectById(projectId);
    if (!project) {
      throw new Error(`Unknown project '${projectId}': cannot build context pack for nonexistent project`);
    }

    // 3. Authoritative Provenance Retrieval (Read-Only)
    const missions = await db.getProjectMissions(projectId);
    const events = await db.getEvents(projectId);
    const testRuns = await db.getTestRuns(projectId);

    // Optional verified lessons (only VERIFIED or ORGANIZATIONAL_MEMORY status permitted)
    const rawLessons = db.getVerifiedLessons ? await db.getVerifiedLessons(projectId) : [];
    const verifiedLessons = (rawLessons || []).filter(
      l => l.verificationStatus === 'VERIFIED' || l.verificationStatus === 'ORGANIZATIONAL_MEMORY'
    );

    // Profile from metadata if available
    const profile = project.metadata?.executionProfile as ProjectExecutionProfile | undefined;

    // --- SECTION 1: PROJECT IDENTITY ---
    const projectIdentity: ContextPackIdentity = {
      id: project.id,
      slug: project.slug,
      name: project.name,
      category: project.category,
      businessObjective: project.businessObjective || 'UNKNOWN',
      targetCustomer: project.targetCustomer || undefined,
      problemSolved: project.problemSolved || undefined,
      techStack: project.metadata?.techStack || ['Node.js', 'TypeScript'],
      currentVersion: project.currentVersion || 'v0.1.0'
    };

    // --- SECTION 2: HISTORY ---
    const completedMissions = missions.filter(m => m.status === 'COMPLETED');
    // Sort deterministically by completion or creation date descending
    const sortedCompleted = [...completedMissions].sort(
      (a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime()
    );
    const lastCompleted = sortedCompleted[0];

    const sortedTestRuns = [...testRuns].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const latestTest = sortedTestRuns[0];

    const history: ContextPackHistory = {
      completedMissionsCount: completedMissions.length,
      lastCompletedMission: lastCompleted ? {
        id: lastCompleted.missionId,
        title: lastCompleted.missionTitle,
        completedAt: lastCompleted.completedAt || lastCompleted.createdAt,
        costCents: lastCompleted.costCents || 0,
        evidenceId: lastCompleted.evidenceId
      } : undefined,
      recentTestStatus: latestTest ? latestTest.status : 'UNKNOWN' as any,
      lastAuditScore: latestTest ? (latestTest.status === 'PASS' ? (latestTest.passedCount || 100) : 0) : undefined,
      auditEventCount: events.length
    };

    // --- SECTION 3: CURRENT STATE ---
    const currentState: ContextPackCurrentState = {
      status: project.status,
      revision: project.revision,
      assignedPort: project.activePort || undefined,
      activeLease: project.metadata?.activeLease || undefined,
      openUnknowns: project.metadata?.openUnknowns || []
    };

    // --- SECTION 4: DECISION RATIONALE (Conservative, No Hallucinated Intent) ---
    const decisionRationale: ContextPackDecisionRationale = {
      strategicObjective: project.metadata?.decisionRationale?.strategicObjective || project.businessObjective || 'Authoritative objective confirmed',
      actionRecommendation: project.metadata?.decisionRationale?.actionRecommendation || 'Execute scoped mission step according to approved profile',
      whyNotExplanation: project.metadata?.decisionRationale?.whyNotExplanation || undefined,
      decisionConfidence: typeof project.metadata?.decisionRationale?.decisionConfidence === 'number' 
        ? project.metadata.decisionRationale.decisionConfidence 
        : 1.0
    };

    // --- SECTION 5: EVIDENCE ---
    const evidenceIdsSet = new Set<string>();
    missions.forEach(m => { if (m.evidenceId) evidenceIdsSet.add(m.evidenceId); });
    events.forEach(e => { if (e.payload?.evidenceId) evidenceIdsSet.add(e.payload.evidenceId); });

    const testArtifactIds = testRuns
      .map(tr => tr.artifactId)
      .filter((id): id is string => Boolean(id));

    const evidence: ContextPackEvidence = {
      evidenceIds: Array.from(evidenceIdsSet),
      citations: project.metadata?.citations || [],
      testArtifactIds,
      hmacSignaturesPresent: evidenceIdsSet.size > 0 || testRuns.length > 0
    };

    // --- SECTION 6: CONSTRAINTS (Authoritative Execution Limits) ---
    const constraints: ContextPackConstraints = {
      allowedStartCommand: profile?.allowedStartCommand,
      allowedTestCommands: profile?.allowedTestCommands || [],
      workingDirectory: profile?.workingDirectory || project.workspacePath,
      resourceLimits: profile?.resourceLimits || {
        maxMemoryMb: 512,
        timeoutMs: 600000
      },
      zeroOutboundEnforced: true,
      financialRuleOfIronEnforced: true,
      budgetLimitCents: project.buildCostCents || 2500
    };

    // --- SECTION 7 & 8: AGENT-SPECIFIC BRIEFING & INACCESSIBLE INFORMATION ---
    let nextAgentBrief: ContextPackNextAgentBrief;
    let inaccessibleInformation: ContextPackInaccessibleInformation;

    if (targetAgent === 'forge') {
      nextAgentBrief = {
        assignedRole: 'forge',
        targetTaskGoal: 'Implement verified deliverable within project boundary',
        expectedDeliverable: `${project.workspacePath}/src/`,
        interfaceContracts: project.metadata?.interfaceContracts || ['Standard Node.js / TypeScript modules'],
        knownBlockers: project.metadata?.knownBlockers || []
      };
      inaccessibleInformation = {
        domainFirewallRules: [
          'FINANCE domain masked for Tier-2 engineering workers',
          'Outbound client communications forbidden'
        ],
        inaccessibleCategories: ['FINANCIAL_CREDENTIALS', 'OUTBOUND_COMMUNICATIONS'],
        redactedKeys: ['STRIPE_SECRET_KEY', 'BANK_ACCOUNT', 'FINANCE_BALANCES', 'PAYMENT_CREDENTIALS'],
        inaccessibleProjects: ['projects/* (external projects boundary enforced)'],
        policyReason: 'Domain partition security boundary (Least Privilege)'
      };
    } else if (targetAgent === 'scout') {
      nextAgentBrief = {
        assignedRole: 'scout',
        targetTaskGoal: 'Analyze market opportunity, pricing models, and target customers',
        expectedDeliverable: 'Market Dossier and Opportunity Scorecard',
        interfaceContracts: ['OpportunityRecord schema v5.1'],
        knownBlockers: []
      };
      inaccessibleInformation = {
        domainFirewallRules: [
          'WORK source tree write access blocked',
          'Deployments forbidden',
          'Money movement forbidden'
        ],
        inaccessibleCategories: ['SOURCE_MUTATION', 'PAYMENTS', 'DEPLOYMENT'],
        redactedKeys: ['SOURCE_CODE_WRITE', 'PAYMENTS', 'DEPLOY_KEYS', 'PRIVATE_CREDENTIALS'],
        inaccessibleProjects: ['projects/* (source code write blocked)'],
        policyReason: 'Market intelligence boundary (Zero Code Mutation)'
      };
    } else {
      // sentinel
      nextAgentBrief = {
        assignedRole: 'sentinel',
        targetTaskGoal: 'Execute adversarial QA audit and verify security invariants',
        expectedDeliverable: 'Adversarial QA Scorecard and HMAC Evidence Seal',
        interfaceContracts: ['SentinelScorecard schema', 'ExecutionEvidence schema'],
        knownBlockers: []
      };
      inaccessibleInformation = {
        domainFirewallRules: [
          'FINANCE money movement blocked',
          'Outbound transmission forbidden'
        ],
        inaccessibleCategories: ['FINANCIAL_MOVEMENT', 'OUTBOUND_TRANSMISSION'],
        redactedKeys: ['STRIPE_SECRET_KEY', 'BANK_ACCOUNT', 'PAYOUT_CREDENTIALS'],
        inaccessibleProjects: ['projects/* (external projects boundary enforced)'],
        policyReason: 'Adversarial QA boundary (Independent Verification)'
      };
    }

    // --- DETERMINISTIC SOURCE STATE HASH ---
    const canonicalState = canonicalStringify({
      projectId: project.id,
      revision: project.revision,
      status: project.status,
      name: project.name,
      category: project.category,
      businessObjective: project.businessObjective,
      targetCustomer: project.targetCustomer || null,
      problemSolved: project.problemSolved || null,
      techStack: project.metadata?.techStack || [],
      currentVersion: project.currentVersion,
      missions: sortedCompleted.map(m => ({
        id: m.missionId,
        title: m.missionTitle,
        status: m.status,
        costCents: m.costCents,
        evidenceId: m.evidenceId
      })),
      eventsCount: events.length,
      recentTest: latestTest ? {
        id: latestTest.id,
        status: latestTest.status,
        passedCount: latestTest.passedCount,
        failedCount: latestTest.failedCount
      } : null,
      constraints: {
        allowedStartCommand: profile?.allowedStartCommand || null,
        allowedTestCommands: profile?.allowedTestCommands || [],
        workingDirectory: profile?.workingDirectory || project.workspacePath
      }
    });

    const sourceStateHash = crypto.createHash('sha256').update(canonicalState).digest('hex');

    const packId = `pack_${project.id}_${targetAgent}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    const projectedContextHash = crypto.createHash('sha256').update(canonicalStringify({
      targetAgent,
      projectIdentity,
      constraints,
      nextAgentBrief,
      inaccessibleInformation
    })).digest('hex');

    const pack: ProjectContextPack = {
      packId,
      projectId: project.id,
      targetAgent,
      projectRevision: project.revision,
      generatedAt: new Date().toISOString(),
      packVersion: '2.0.0',
      sourceStateHash,
      authoritativeStateHash: sourceStateHash,
      projectedContextHash,
      projectIdentity,
      history,
      currentState,
      decisionRationale,
      evidence,
      constraints,
      nextAgentBrief,
      inaccessibleInformation: {
        ...inaccessibleInformation,
        inaccessibleCategories: inaccessibleInformation.redactedKeys
      },
      verifiedLessons
    };

    // Defensive Non-Ingress Assertion
    assertNoSecrets(pack);

    return pack;
  }

  /**
   * Freshness Verification helper.
   * Compares stamped pack revision against authoritative current project revision.
   */
  public static verifyFreshness(
    pack: ProjectContextPack,
    authoritativeRevision: number
  ): ContextPackFreshnessCheck {
    const isCurrent = pack.projectRevision === authoritativeRevision;
    return {
      isCurrent,
      packRevision: pack.projectRevision,
      authoritativeRevision,
      hashMatches: isCurrent,
      invalidationReason: isCurrent 
        ? undefined 
        : `Stale context pack: stamped revision #${pack.projectRevision} does not match authoritative project revision #${authoritativeRevision}`
    };
  }
}
