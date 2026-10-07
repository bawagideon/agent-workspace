/**
 * ==============================================================================
 * GIDEON AI HQ — PHASE 2: CONTEXT ENGINE DOMAIN CONTRACTS
 * Architectural Hierarchy:
 *   Supabase (Authoritative State) ➔ Context Engine (Projection) ➔ Context Pack (Read-Only)
 *
 * Core Guarantees:
 * 1. Read-Only Projection: Context Packs are derived snapshots, NEVER competing authority.
 * 2. Provenance & Confidence != Truth: Confidence scores never substitute for verification.
 * 3. 8 First-Class Operational Questions: Explicit auditable sections per agent briefing.
 * 4. Stale Revision Invalidation: Stamped with projectRevision & sourceStateHash.
 * 5. Lesson Promotion Gate: Hard state machine prevents unverified memory pollution.
 * ==============================================================================
 */

export type ContextCategory = 
  | 'USER' 
  | 'PROJECT' 
  | 'BUSINESS' 
  | 'AGENT' 
  | 'MISSION' 
  | 'EXPERIMENT' 
  | 'TECHNICAL' 
  | 'LESSONS'
  | 'WORK';

export type LessonVerificationStatus = 
  | 'OBSERVED' 
  | 'PROPOSED' 
  | 'REVIEWED' 
  | 'VERIFIED' 
  | 'ORGANIZATIONAL_MEMORY';

/**
 * Provenance-rich operational lesson.
 * Strict Invariant: Confidence (heuristic) != Truth (verification).
 * Only VERIFIED / ORGANIZATIONAL_MEMORY lessons can be injected into agent Context Packs.
 */
export interface VerifiedLesson {
  id: string;
  key: string;
  category: ContextCategory;
  statement: string; // The concrete operational lesson or rule
  rationale: string;
  source: {
    missionId?: string;
    taskId?: string;
    agentId: string;
    observedAt: string;
  };
  verificationStatus: LessonVerificationStatus;
  confidence: number; // 0.0 to 1.0 (statistical/heuristic confidence, NOT truth)
  revision: number; // OCC revision for atomic concurrency
  verifiedBy?: 'human' | 'sentinel';
  verifiedAt?: string;
  evidenceIds: string[]; // references to cryptographic HMAC evidence or test run artifacts
  distinctProjectIds?: string[]; // Distinct validated project IDs (>=3 required for ORGANIZATIONAL_MEMORY)
  rejectionReason?: string;
}

// ------------------------------------------------------------------------------
// FIRST-CLASS 8-QUESTION CONTEXT PACK SECTIONS
// ------------------------------------------------------------------------------

/** 1. What is this project? */
export interface ContextPackIdentity {
  id: string;
  slug: string;
  name: string;
  category: string;
  businessObjective: string;
  targetCustomer?: string;
  problemSolved?: string;
  techStack: string[];
  currentVersion: string;
}

/** 2. What has Gideon already done? */
export interface ContextPackHistory {
  completedMissionsCount: number;
  lastCompletedMission?: {
    id: string;
    title: string;
    completedAt: string;
    costCents: number;
    evidenceId?: string;
  };
  recentTestStatus: 'PASS' | 'FAIL' | 'BLOCKED' | 'SKIPPED' | 'FLAKY';
  lastAuditScore?: number;
  auditEventCount: number;
}

/** 3. What is currently happening? */
export interface ContextPackCurrentState {
  status: string;
  revision: number;
  assignedPort?: number;
  activeLease?: {
    runnerId: string;
    pid: number;
    port: number;
    expiresAt: string;
  };
  openUnknowns: string[];
}

/** 4. Why did Gideon make the current decision? */
export interface ContextPackDecisionRationale {
  strategicObjective: string;
  actionRecommendation: string;
  whyNotExplanation?: string;
  decisionConfidence: number; // 0.0 - 1.0
}

/** 5. What evidence supports the decision? */
export interface ContextPackEvidence {
  evidenceIds: string[];
  citations: string[];
  testArtifactIds: string[];
  hmacSignaturesPresent: boolean;
}

/** 6. What constraints apply? */
export interface ContextPackConstraints {
  allowedStartCommand?: string;
  allowedTestCommands: string[];
  workingDirectory: string;
  resourceLimits: {
    maxMemoryMb: number;
    timeoutMs: number;
  };
  zeroOutboundEnforced: boolean;
  financialRuleOfIronEnforced: boolean;
  budgetLimitCents: number;
}

/** 7. What should the next agent know? */
export interface ContextPackNextAgentBrief {
  assignedRole: string; // forge, sentinel, scout, release
  targetTaskGoal: string;
  expectedDeliverable: string;
  interfaceContracts: string[];
  knownBlockers: string[];
}

/** 8. What information must remain inaccessible to that agent? */
export interface ContextPackInaccessibleInformation {
  domainFirewallRules: string[];
  inaccessibleCategories: string[]; // High-level security categories: 'FINANCIAL_CREDENTIALS', 'CROSS_PROJECT_DATA', etc.
  redactedKeys: string[]; // Retained for backward-compat
  inaccessibleProjects: string[];
  forbiddenCapabilities?: string[];
  policyReason: string;
}

export type ContextTargetAgent = 'forge' | 'sentinel' | 'scout';

/**
 * Declarative Agent Security Policy governing least-privilege projection.
 */
export interface AgentSecurityPolicy {
  targetAgent: ContextTargetAgent;
  allowedDomains: ContextCategory[];
  allowedFields: string[];
  forbiddenCategories: string[];
  forbiddenCapabilities: string[];
  policyReason: string;
}

/**
 * Deterministic, Read-Only Project Context Pack
 * Handed to autonomous agents before mission execution.
 */
export interface ProjectContextPack {
  packId: string; // e.g. pack_proj_b2b_1790318...
  projectId: string;
  targetAgent: ContextTargetAgent; // forge, sentinel, scout
  projectRevision: number; // Stamped project revision for stale-context invalidation
  generatedAt: string;
  packVersion: string; // Schema version, e.g. "2.0.0"
  sourceStateHash: string; // SHA256 hash of authoritative state snapshot
  authoritativeStateHash?: string; // Explicit alias for underlying state snapshot
  projectedContextHash?: string; // SHA256 hash of agent-scoped projected view
  
  // First-Class 8-Question Sections
  projectIdentity: ContextPackIdentity;
  history: ContextPackHistory;
  currentState: ContextPackCurrentState;
  decisionRationale: ContextPackDecisionRationale;
  evidence: ContextPackEvidence;
  constraints: ContextPackConstraints;
  nextAgentBrief: ContextPackNextAgentBrief;
  inaccessibleInformation: ContextPackInaccessibleInformation;

  // Verified organizational lessons (Strictly VERIFIED / ORGANIZATIONAL_MEMORY only)
  verifiedLessons: VerifiedLesson[];
}

/**
 * Invalidation and freshness check contract.
 */
export interface ContextPackFreshnessCheck {
  isCurrent: boolean;
  packRevision: number;
  authoritativeRevision: number;
  hashMatches: boolean;
  invalidationReason?: string;
}
