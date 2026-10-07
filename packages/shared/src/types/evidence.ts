/**
 * ==============================================================================
 * GIDEON AI HQ — ENGINEERING EVIDENCE LEDGER & REPUTATION TYPES
 * Canonical Derived Evidence Projection Schema
 * ==============================================================================
 */

export type ClaimStatus = 
  | 'VERIFIED'
  | 'STALE'
  | 'UNRESOLVED'
  | 'CONTRADICTED'
  | 'BLOCKED';

export type ReputationStatus = 
  | 'PRIVATE'
  | 'VERIFIED'
  | 'PUBLISHABLE'
  | 'FEATURED'
  | 'ARCHIVED';

export interface EngineeringClaim {
  id: string;
  statement: string;
  evidenceRef?: string;
  evidenceHash?: string;
  evidencePath?: string;
  category?: string;
  verificationMethod?: string;
  status: ClaimStatus;
  verifiedAt?: string;
  metrics?: Record<string, any>;
  contradictionReason?: string;
}

export interface CapabilityTarget {
  domain: string;
  engineeringSignals: string[];
  businessRelevance: string;
  publicArtifact: string;
}

export interface RepositoryDetails {
  name: string;
  fullName?: string;
  url: string;
  visibility: 'public' | 'private';
  defaultBranch: string;
  commitSha?: string;
}

export interface DeploymentDetails {
  url?: string;
  publicUrl?: string;
  stagingPort?: number;
  provider: string;
  type: 'LIVE_PUBLIC' | 'STAGING_PREVIEW' | 'ARCHITECTURE_ONLY';
  status: 'ACTIVE' | 'OFFLINE';
}

export interface ArchitectureDetails {
  overview: string;
  diagramMermaid: string;
  decisions: Array<{ decision: string; rationale: string }>;
  tradeoffs: Array<{ tradeoff: string; mitigation: string }>;
}

export interface VerificationScorecard {
  buildPassed: boolean;
  testsPassed: number;
  testsTotal: number;
  securityPassed: boolean;
  secretsScanPassed: boolean;
  idempotencyVerified: boolean;
  sentinelEvidenceId: string;
  hmacSignature: string;
  evaluatedAt: string;
}

export interface BenchmarkRecord {
  name: string;
  metric: string;
  methodology: string;
}

/**
 * EngineeringEvidence is strictly a canonical derived projection.
 * Authoritative ground truth remains in Project OS, Sentinel runs, and sealed evidence files.
 */
export interface EngineeringEvidence {
  projectId: string;
  projectName: string;
  category: 'BACKEND_SYSTEMS' | 'AI_AGENTIC' | 'DEV_TOOLING' | 'DISTRIBUTED_SYSTEMS' | 'SECURITY_INFRA' | 'FULL_STACK';
  capabilityTarget: CapabilityTarget;
  repository: RepositoryDetails;
  deployment: DeploymentDetails;
  stack: string[];
  architecture: ArchitectureDetails;
  verification: VerificationScorecard;
  benchmarks: BenchmarkRecord[];
  claims: EngineeringClaim[];
  reputationStatus: ReputationStatus;
  derivedAt: string;
}

export interface PublicPortfolioProject {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: Array<{ name: string; color: string }>;
  image: string;
  source_code_link: string;
  demo_link?: string;
  isArchitectureOnly: boolean;
  engineeringSignals: string[];
  evidenceRef: string;
  featured: boolean;
}

export interface ContentEvidencePack {
  projectId: string;
  projectName: string;
  technicalCaseStudy: string;
  architectureWalkthrough: string;
  interviewTalkingPoints: Array<{ question: string; talkingPoint: string; evidenceCitation: string }>;
  linkedInDraft: {
    hook: string;
    technicalBody: string;
    tradeoffsAndLessons: string;
    callToAction: string;
    fullText: string;
    claims: EngineeringClaim[];
  };
  generatedAt: string;
}

export interface ClaimValidationResult {
  isValid: boolean;
  errors: string[];
  claimsCount?: number;
  verifiedCount?: number;
  blockedCount?: number;
  staleCount?: number;
  blockedReasons?: string[];
}

export type StorySlidePurpose =
  | 'HOOK_TENSION'
  | 'NAIVE_ASSUMPTION'
  | 'REALITY_FAILURE'
  | 'CONCURRENCY_BENCHMARK'
  | 'SYSTEM_PILLARS'
  | 'INTERACTIVE_PROOF'
  | 'ARCHITECTURE_TOPOLOGY'
  | 'ENGINEERING_LESSON';

export type StoryVisualType =
  | 'COLLISION_DIAGRAM'
  | 'FLOW_PIPELINE'
  | 'STEP_SEQUENCE'
  | 'RETRY_STORM'
  | 'STORM_TIMELINE'
  | 'BENCHMARK_SCORECARD'
  | 'PILLAR_CARDS'
  | 'INVARIANT_LIST'
  | 'SIMULATOR_SANDBOX'
  | 'COMPONENT_SEQUENCE'
  | 'TOPOLOGY_MAP'
  | 'CODE_DIFF'
  | 'PHILOSOPHY_CTA';

export interface VisualAsset {
  id: string;
  type: StoryVisualType;
  title: string;
  caption: string;
  format: 'svg' | 'png';
  filePath: string;
  publicUrl?: string;
  svgContent?: string;
}

export interface StorySlide {
  slideNumber: number;
  purpose: StorySlidePurpose;
  headline: string;
  subtext: string;
  visual: VisualAsset;
  evidenceCitation?: string;
  claimId?: string;
}

export interface LinkedInStoryPack {
  projectId: string;
  projectName: string;
  narrativePost: {
    hook: string;
    incitingIncident: string;
    technicalJourney: string;
    verifiedResolution: string;
    keyTakeaway: string;
    fullText: string;
    contentHash: string;
  };
  slides: StorySlide[];
  evidenceContractId: string;
  claims: EngineeringClaim[];
  generatedAt: string;
  status: 'DRAFT' | 'READY_FOR_APPROVAL' | 'APPROVED' | 'PUBLISHED';
}

