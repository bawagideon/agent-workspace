export type ProjectCategory = 
  | 'SAAS' 
  | 'CLIENT_SERVICE' 
  | 'API_SERVICE' 
  | 'INTERNAL_TOOL' 
  | 'AUTOMATION';

export type ProjectStatus = 
  | 'DISCOVERY' 
  | 'SCAFFOLDING' 
  | 'BUILDING' 
  | 'TESTING' 
  | 'QA_VERIFIED' 
  | 'STAGING' 
  | 'CLIENT_REVIEW' 
  | 'CLIENT_ACCEPTED'
  | 'REWORK_REQUESTED'
  | 'COMMERCIAL_CLEAR'
  | 'DEPLOY_AUTHORIZATION'
  | 'DEPLOYING'
  | 'DEPLOYMENT_FAILED'
  | 'DEPLOYED' 
  | 'ARCHIVED' 
  | 'DECOMMISSIONED';

export type ProjectHealthStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL';

export type ProjectTestStatus = 'PASS' | 'FAIL' | 'BLOCKED' | 'SKIPPED' | 'FLAKY';

export interface ProjectRecord {
  id: string; // e.g. proj_b2b_automation_service
  slug: string; // b2b-automation-service
  name: string;
  category: ProjectCategory;
  status: ProjectStatus;
  workspacePath: string; // relative to workspaceRoot, e.g. projects/b2b-automation-service
  repository?: string;
  currentVersion: string; // v0.1.0
  revision: number; // Optimistic concurrency revision counter
  businessObjective: string;
  targetCustomer?: string;
  problemSolved?: string;
  pricingCents: number;
  quotedPriceCents?: number;
  currency: 'USD' | 'NGN';
  buildCostCents: number;
  totalTokensUsed: number;
  healthStatus: ProjectHealthStatus;
  activePort?: number;
  budgetCapCents?: number;
  cashReceivedCents?: number;
  settledSpendCents?: number;
  reservedSpendCents?: number;
  paymentState?: 
    | 'UNFUNDED'
    | 'PARTIALLY_FUNDED'
    | 'FUNDED'
    | 'EXECUTION_SUSPENDED'
    | 'BUDGET_EXHAUSTED'
    | 'REFUND_PENDING'
    | 'REFUNDED'
    | 'PAYMENT_REVERSED';
  minimumDepositCents?: number;
  depositPercentage?: number;
  stripeCustomerId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectEvent {
  id: string;
  eventId: string; // Deterministic UUID for idempotent sync
  projectId: string;
  eventType: 
    | 'PROJECT_CREATED'
    | 'REQUIREMENTS_UPDATED'
    | 'CONTEXT_PACK_UPDATED'
    | 'AGENT_STARTED'
    | 'AGENT_COMPLETED'
    | 'BUILD_STARTED'
    | 'BUILD_FAILED'
    | 'TEST_STARTED'
    | 'TEST_PASSED'
    | 'TEST_FAILED'
    | 'QA_REJECTED'
    | 'QA_APPROVED'
    | 'RUNNER_STARTED'
    | 'RUNNER_STOPPED'
    | 'PREVIEW_CREATED'
    | 'CLIENT_REVIEW_STARTED'
    | 'APPROVAL_REQUESTED'
    | 'APPROVAL_GRANTED'
    | 'STATUS_TRANSITIONED'
    | 'DEPLOYMENT_STARTED'
    | 'DEPLOYMENT_COMPLETED'
    | 'PROJECT_ARCHIVED'
    | 'PAYMENT_RECEIVED'
    | 'SPEND_RESERVED'
    | 'SPEND_SETTLED'
    | 'SPEND_RELEASED'
    | 'PAYMENT_REFUNDED'
    | 'PAYMENT_REVERSED'
    | 'FINANCIAL_TERMS_MUTATED'
    | 'PORTAL_ACCESS_ISSUED'
    | 'PORTAL_ACCESS_REVOKED'
    | 'PORTAL_SESSION_BOOTSTRAPPED'
    | 'CLIENT_REVIEW_FEEDBACK'
    | 'CLIENT_MILESTONE_ACCEPTED';
  actor: string; // atlas, forge, sentinel, release, human, system
  payload: Record<string, any>;
  createdAt: string;
}

export interface ProjectMissionLink {
  id: string;
  projectId: string;
  missionId: string;
  missionTitle: string;
  objective: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'BLOCKED';
  assignedRole: string;
  costCents?: number;
  tokensUsed?: number;
  evidenceId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ProjectTestRun {
  id: string;
  projectId: string;
  suiteName: string;
  command: string;
  status: ProjectTestStatus;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  durationMs: number;
  exitCode: number;
  gitCommit?: string;
  artifactId?: string; // Reference to stored log artifact on disk, NOT giant raw string
  createdAt: string;
}

export interface ProjectRunnerLease {
  id: string;
  projectId: string;
  runnerId: string;
  pid: number;
  port: number;
  status: 'ACTIVE' | 'RELEASED' | 'EXPIRED' | 'TERMINATED';
  startedAt: string;
  heartbeatAt: string;
  expiresAt: string;
  exitCode?: number;
}

export interface ProjectExecutionProfile {
  projectId: string;
  allowedStartCommand: string;
  allowedTestCommands: string[];
  workingDirectory: string;
  environmentPolicy: string[];
  allowedPorts: number[];
  resourceLimits: {
    maxMemoryMb: number;
    timeoutMs: number;
  };
  profileVersion: number;
  approvedAt?: string;
  approvedBy?: string;
}

export interface PortalAccessRecord {
  id: string; // opaque shareId
  projectId: string;
  credentialHash: string;
  permissions: string[];
  expiresAt: string;
  usedAt?: string;
  revokedAt?: string;
  createdBy: string;
  createdAt: string;
  version: number;
}

export interface PortalSessionRecord {
  id: string;
  sessionHash: string;
  shareId: string;
  projectId: string;
  permissions: string[];
  csrfToken: string;
  expiresAt: string;
  revokedAt?: string;
  createdAt: string;
}

export interface PortalFeedbackIdempotencyRecord {
  projectId: string;
  idempotencyKey: string;
  shareId: string;
  requestHash: string;
  createdAt: string;
  responsePayload: any;
}

export type ExecutionMode = 'REHEARSAL' | 'REAL_PILOT';

export interface AcceptanceContract {
  functional: string[];
  security: string[];
  reliability: string[];
  delivery: string[];
}

export interface PilotQualificationContract {
  opportunityId: string;
  expectedPriceCents: number;
  expectedDepositCents: number;
  estimatedComputeCostCents: number;
  maximumComputeBudgetCents: number;
  expectedHumanMinutes: number;
  scopeBoundary: string[];
  acceptanceCriteria: AcceptanceContract;
  deploymentTarget: string;
  rollbackPlan: string;
  economicVerdict: 'ELIGIBLE' | 'INELIGIBLE';
  reason: string;
  qualifiedAt: string;
}

export type InterventionType = 
  | 'AUTHORIZED_HUMAN_GATE' 
  | 'EXPECTED_OPERATOR_ACTION' 
  | 'UNEXPECTED_INTERVENTION' 
  | 'FAILURE_RECOVERY';

export interface PilotScoreboardRecord {
  id: string;
  mode: ExecutionMode;
  projectId: string;
  opportunityId: string;
  cashReceivedRealCents: number;
  syntheticCashReceivedCents: number;
  grossRevenueCents: number;
  processingFeesCents: number;
  externalInfraCents: number;
  computeSpendCents: number;
  netContributionCents: number;
  contributionMarginPercent: number;
  humanAuthorityGateEvents: number;
  unexpectedManualInterventions: number;
  humanTouchRatio: number;
  autonomyCoveragePercent: number;
  humanInterventionMinutes: number;
  leadToProposalMs: number;
  depositToStagingMs: number;
  clientAcceptanceMs: number;
  deployMs: number;
  revisionCount: number;
  defectCount: number;
  rollbackCount: number;
  postDeployVerified: boolean;
  evidenceComplete: boolean;
  sealedAt: string;
  hmacSignature: string;
}

