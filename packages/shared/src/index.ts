import { z } from 'zod';

// =============================================================================
// 1. RISK & APPROVAL ENUMS & TYPES
// =============================================================================
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ApprovalMode = 'AUTO' | 'PLAN' | 'SESSION' | 'ALWAYS_ASK' | 'PLAN_APPROVAL' | (string & {});

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'INVALIDATED';

export type ActionType = 'FILE_READ' | 'FILE_WRITE' | 'GIT_COMMIT' | 'GIT_PUSH' | 'RUN_COMMAND' | 'DEPLOY';

export interface ApprovalRequest {
  id: string;
  taskId: string;
  taskRunId?: string;
  planId?: string;
  planStepId?: string;
  agentId: string;
  workspaceId: string;
  riskLevel: RiskLevel;
  approvalMode: ApprovalMode;
  actionType: ActionType;
  description: string;
  diffPreview?: string;
  commandPreview?: string;
  authorizationHash?: string;
  scopeHash?: string;
  baseCommit?: string;
  status: ApprovalStatus;
  expiresAt: string;
  reviewerNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface PlanAuthorization {
  id: string;
  planId: string;
  approvalId: string;
  authorizationHash: string;
  scopeHash: string;
  allowedFiles: string[];
  allowedCommands: string[];
  baseCommit?: string;
  expiresAt: string;
  usedAt?: string;
  revokedAt?: string;
}

// =============================================================================
// 2. RUNNER & MACHINE TYPES
// =============================================================================
export type MachineStatus = 'ONLINE' | 'BUSY' | 'DEGRADED' | 'OFFLINE' | 'QUARANTINED';

export interface Machine {
  id: string;
  name: string;
  platform: 'win32' | 'linux' | 'darwin';
  runnerVersion: string;
  status: MachineStatus;
  lastHeartbeatAt: string;
  capabilities: string[];
  activeTaskCount: number;
  createdAt: string;
}

export interface RunnerHeartbeat {
  machineId: string;
  status: MachineStatus;
  platform: string;
  runnerVersion: string;
  capabilities: string[];
  activeTasks: number;
  lastHeartbeatAt: string;
}

// =============================================================================
// 3. WORKSPACES & SANDBOX
// =============================================================================
export type WorkspaceAccessMode = 'READ_ONLY' | 'READ_WRITE' | 'DISABLED';

export type WorkspaceType = 'ACTIVE' | 'REFERENCE' | 'ARCHIVED';

export type WorkspaceStatus = 'READY' | 'DIRTY' | 'NEEDS_ATTENTION' | 'UNREACHABLE';

export interface Workspace {
  id: string;
  machineId?: string;
  name: string;
  rootPath: string;
  workspaceType: WorkspaceType;
  accessMode: WorkspaceAccessMode;
  status: WorkspaceStatus;
  gitEnabled: boolean;
  defaultBranch: string;
  allowedAgents: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkspacePolicy {
  id: string;
  workspaceId: string;
  allowReads: boolean;
  allowWrites: boolean;
  allowTerminal: boolean;
  allowGit: boolean;
  allowNetwork: boolean;
  defaultApprovalMode: ApprovalMode;
  allowedCommands: string[];
  blockedCommands: string[];
  blockedPatterns: string[];
  createdAt: string;
}

// =============================================================================
// 4. AGENTS & PROFILES
// =============================================================================
export type AgentStatus = 'IDLE' | 'PLANNING' | 'WORKING' | 'WAITING_APPROVAL' | 'PAUSED';

export interface Agent {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  department: 'Development' | 'QA' | 'Management' | 'Career' | 'Media' | 'Finance' | 'Operations' | 'Intelligence' | string;
  description?: string;
  primaryModel: string;
  fallbackModel?: string;
  status: AgentStatus;
  capabilities: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AgentProfile {
  agentId: string;
  systemInstruction: string;
  temperature: number;
  maxTokens: number;
  budgetPerTask: number;
  maxRetries: number;
  version: number;
  isEnabled: boolean;
  updatedAt: string;
}

// =============================================================================
// 5. TASKS, RUNS, PLANS & EXECUTION CONTRACTS
// =============================================================================
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TaskStatus =
  | 'CREATED'
  | 'QUEUED'
  | 'RUNNER_ASSIGNED'
  | 'CONTEXT_LOADING'
  | 'INSPECTING'
  | 'PLANNING'
  | 'WAITING_APPROVAL'
  | 'EXECUTING'
  | 'RUNNING'
  | 'OBSERVING'
  | 'SELF_REVIEW'
  | 'QA_PENDING'
  | 'QA_EXECUTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'BLOCKED'
  | 'BLOCKED_OFFLINE'
  | 'CANCELLED'
  | 'PAUSED'
  | 'EMERGENCY_STOPPED';

export interface ExecutionContract {
  taskId: string;
  runId: string;
  workspaceId: string;
  runnerId: string;
  baseCommit?: string;
  allowedPaths: string[];
  allowedTools: string[];
  allowedCommands: string[];
  maxSteps: number;
  maxRuntimeMs: number;
  maxCost: number;
  approvalMode: ApprovalMode;
  rollbackStrategy: 'GIT_DISCARD' | 'FILE_BACKUP' | 'NONE';
  contractHash: string;
  createdAt: string;
  expiresAt: string;
}

export interface Task {
  id: string;
  workspaceId?: string;
  title: string;
  goal: string;
  assignedAgentId?: string;
  department: string;
  priority: TaskPriority;
  autonomyMode: 'AUTO' | 'PLAN_APPROVAL' | 'SESSION' | 'ALWAYS_ASK';
  status: TaskStatus;
  parentTaskId?: string;
  resultSummary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskRun {
  id: string;
  taskId: string;
  runnerId?: string;
  runNumber: number;
  status: string;
  totalTokens: number;
  totalCost: number;
  startedAt: string;
  completedAt?: string;
}

export interface PlanStep {
  id: string;
  planId: string;
  stepNumber: number;
  description: string;
  toolId: string;
  inputParams: Record<string, any>;
  riskLevel: RiskLevel;
  expectedOutcome?: string;
  verificationMethod?: string;
  rollbackStrategy?: string;
  status: 'PENDING' | 'APPROVED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
}

export interface ExecutionPlan {
  id: string;
  taskRunId: string;
  version: number;
  status: 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'EXECUTING' | 'COMPLETED';
  riskSummary?: string;
  steps: PlanStep[];
  planToken?: string;
  createdAt: string;
}

export interface ExecutionJob {
  id: string;
  taskId: string;
  runId: string;
  stepId?: string;
  machineId: string;
  workspaceId: string;
  toolId: string;
  inputParams: Record<string, any>;
  status: 'PENDING' | 'CLAIMED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'BLOCKED';
  authorizationHash?: string;
  idempotencyKey: string;
  leaseExpiresAt?: string;
  claimedBy?: string;
  attemptCount: number;
  outputResult?: Record<string, any>;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

// =============================================================================
// 6. QA & MODEL PROVIDER INTERFACES
// =============================================================================
export interface QAReviewResult {
  passed: boolean;
  score: number; // 0-100
  typeCheckPassed: boolean;
  testsPassed: boolean;
  securityClean: boolean;
  bugsReported: Array<{ file: string; line?: number; severity: 'LOW' | 'MEDIUM' | 'HIGH'; message: string }>;
  feedbackForForge?: string;
}

export interface ModelProvider {
  name: string;
  generatePlan(goal: string, context: Record<string, any>): Promise<ExecutionPlan>;
  reviewCode(taskGoal: string, diff: string, testLogs: string): Promise<QAReviewResult>;
}

// =============================================================================
// 7. MEMORY & PLAYBOOKS
// =============================================================================
export type MemoryCategory = 'USER' | 'PROJECT' | 'AGENT' | 'LESSON';

export type MemoryStatus = 'CANDIDATE' | 'VERIFIED' | 'ACTIVE' | 'DISABLED' | 'SUPERSEDED' | 'ARCHIVED';

export interface MemoryRecord {
  id: string;
  category: MemoryCategory;
  workspaceId?: string;
  agentId?: string;
  key: string;
  value: Record<string, any>;
  confidence: number;
  status: MemoryStatus;
  sourceType: 'USER_EXPLICIT' | 'TASK_LESSON' | 'SENTINEL_QA';
  sourceReference?: string;
  createdAt: string;
  lastConfirmedAt: string;
}

export interface Playbook {
  id: string;
  name: string;
  category: string;
  type: 'DETERMINISTIC' | 'ADAPTIVE';
  description?: string;
  trigger?: string;
  steps: Array<{ step: number; action: string; tool: string; [key: string]: any }>;
  version: number;
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
}

// =============================================================================
// 8. AGENT ECONOMY, WORKFORCE CONSTITUTIONS & DUAL-CURRENCY LEDGER (V5.0)
// =============================================================================
export type AgentTier = 1 | 2 | 3; // 1 = Executive/Staff, 2 = Specialists, 3 = Ephemeral

export interface AgentConstitution {
  id: string;
  name: string;
  tier: AgentTier;
  role: string;
  department: string;
  mission: string;
  principles: string[];
  modelName: string;
  fallbackModels: string[];
  thinkingLevel: 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'adaptive';
  allowedTools: string[];
  deniedTools: string[];
  budgetLimitCents: number;
  currentSpendCents?: number;
  subagentPolicy?: {
    canSpawn: boolean;
    maxChildren: number;
    allowedChildAgentIds?: string[];
  };
  ephemeralConfig?: {
    ttlSeconds: number;
    destroyOnComplete: boolean;
  };
}

export type TransactionType = 'REVENUE' | 'EXPENSE' | 'TOKEN_COST' | 'ROYALTY' | 'BOUNTY' | 'PROVISIONING';

export type LedgerCurrency = 'USD' | 'EUR' | 'GBP' | 'TOKEN' | 'CREDIT';

export interface LedgerTransaction {
  id: string;
  transactionType: TransactionType;
  currency: LedgerCurrency;
  amountCents: number;
  tokenCount?: number;
  unitCostCents?: number;
  agentId?: string;
  taskId?: string;
  taskRunId?: string;
  missionId?: string;
  status: 'PENDING' | 'COMMITTED' | 'DISPUTED' | 'VOIDED';
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export type OpportunitySource = 
  | 'UPWORK' 
  | 'GITHUB_BOUNTY' 
  | 'MARKET_SCAN' 
  | 'DIRECT_LEAD' 
  | 'INTERNAL' 
  | 'SCOUT' 
  | 'HUMAN' 
  | 'CLIENT' 
  | 'GITHUB' 
  | 'MARKET_SIGNAL' 
  | 'AGENT';

export type OpportunityType =
  | 'CLIENT_WORK'
  | 'BOUNTY'
  | 'PRODUCT'
  | 'SAAS'
  | 'TEMPLATE'
  | 'CONTENT'
  | 'AUTOMATION'
  | 'API_SERVICE'
  | 'PARTNERSHIP'
  | 'OTHER';

export type OpportunityStatus = 
  | 'DISCOVERED' 
  | 'ANALYZING' 
  | 'APPROVED' 
  | 'CONVERTED_TO_MISSION' 
  | 'EXPIRED'
  | 'CAPTURED'
  | 'TRIAGED'
  | 'INVESTIGATING'
  | 'VALIDATED'
  | 'EXPERIMENT'
  | 'EXPERIMENT_READY'
  | 'EXPERIMENT_RUNNING'
  | 'MISSION_READY'
  | 'MONITOR'
  | 'DECISION'
  | 'WON'
  | 'LOST'
  | 'REJECTED'
  | 'PRODUCTIZED';

export type OpportunityRecommendation = 
  | 'PURSUE' 
  | 'INVESTIGATE' 
  | 'EXPERIMENT' 
  | 'MONITOR' 
  | 'PRODUCTIZE' 
  | 'REJECT';

export type RejectionReason =
  | 'ECONOMICALLY_BAD'
  | 'TECHNICALLY_BAD'
  | 'MARKET_TOO_SMALL'
  | 'COMPETITION_TOO_STRONG'
  | 'TIMING_BAD'
  | 'DISTRIBUTION_BAD'
  | 'INSUFFICIENT_EVIDENCE';

export type DeliveryVehicle =
  | 'MICRO_SAAS'
  | 'TEMPLATE'
  | 'API_SERVICE'
  | 'AUTOMATION'
  | 'FREELANCE_DELIVERY'
  | 'CONTENT'
  | 'AGENCY_SERVICE';

export type RevenueLifecycleStage =
  | 'ESTIMATED'
  | 'PROPOSED'
  | 'WON'
  | 'DELIVERED'
  | 'INVOICED'
  | 'COLLECTED'
  | 'NET_REALIZED';

export interface EvidenceReference {
  claim: string;
  source: string;
  url?: string;
  verified: boolean;
  timestamp: string;
}

export interface OpportunityRecord {
  id: string;
  title: string;
  description?: string;
  source: OpportunitySource;
  type?: OpportunityType;
  sourceUrl?: string;
  estimatedValueCents: number;
  estimatedRecurringRevenueCents?: number;
  confidenceScore: number;
  confidence?: number; // 0.0 - 1.0 calibrated
  probabilityOfWinning?: number;
  estimatedAICostCents?: number;
  estimatedInfraCostCents?: number;
  estimatedHumanMinutes?: number;
  technicalDifficulty?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  competition?: 'LOW' | 'MEDIUM' | 'HIGH';
  customerValue?: number;
  repeatPotential?: number;
  expectedValueCents?: number;
  expectedHumanHourReturnCents?: number;
  unknowns?: string[];
  evidence?: EvidenceReference[];
  recommendation?: OpportunityRecommendation;
  rejectionReason?: RejectionReason;
  deliveryVehicle?: DeliveryVehicle;
  revenueStage?: RevenueLifecycleStage;
  status: OpportunityStatus;
  targetSkills: string[];
  convertedTaskId?: string;
  missionId?: string;
  metadata?: Record<string, any>;
  discoveredAt: string;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvestigationContract {
  opportunityId: string;
  maxBudgetCents: number;
  maxRuntimeMinutes: number;
  permittedTools: string[];
  forbiddenActions: string[];
  successCriteria: string[];
  issuedAt: string;
}

export interface ExperimentContract {
  id: string;
  opportunityId: string;
  hypothesis: string;
  experimentType: 'INTERACTIVE_DEMO' | 'LANDING_PAGE_MOCK' | 'CLI_PROTOTYPE' | 'PRICING_TEST' | 'COMPETITOR_AUDIT';
  spendCapCents: number;
  maxAgentMinutes: number;
  priorConfidence: number;
  posteriorConfidence?: number;
  successMetric: string;
  resultData?: Record<string, any>;
  status: 'PLANNED' | 'RUNNING' | 'COMPLETED' | 'ABORTED';
  decision?: 'BUILD' | 'TEST_AGAIN' | 'MONITOR' | 'ABANDON';
  createdAt: string;
  completedAt?: string;
}

export interface MissionContract {
  id: string;
  opportunityId: string;
  objective: string;
  deliveryVehicle: DeliveryVehicle;
  sandboxPath: string;
  isolatedSandboxDir?: string;
  allowedDomains: string[];
  budgetLimitCents: number;
  spendCapCents?: number;
  maxRuntimeMinutes: number;
  allowedTools: string[];
  forbiddenTools: string[];
  sentinelAcceptanceScore: number;
  sentinelQaThreshold?: number;
  createdAt: string;
}

export type ExperimentStatus = 'PROPOSED' | 'APPROVED' | 'RUNNING' | 'VALIDATED' | 'FAILED' | 'SCALED' | 'TERMINATED';

export interface RevenueExperiment {
  id: string;
  title: string;
  hypothesis: string;
  status: ExperimentStatus;
  budgetLimitCents: number;
  spendCents: number;
  revenueCollectedCents: number;
  successCriteria?: Record<string, any>;
  metrics?: Record<string, any>;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}


export interface TeamDefinition {
  id: string;
  name: string;
  leadAgentId: string;
  memberAgentIds: string[];
  purpose: string;
  budgetCapCents: number;
  activeMissionCount: number;
  status: 'ACTIVE' | 'PAUSED' | 'DISBANDED';
}

// =============================================================================
// 9. THE IMMUTABLE EVIDENCE LAYER & DETERMINISTIC PRICING (V5.0)
// =============================================================================
export interface ExecutionEvidence {
  id: string;
  missionId?: string;
  taskId: string;
  stepId?: string;
  agentId: string;
  sessionKey: string;
  runId?: string;
  model: string;
  toolNames: string[];
  toolArgs?: Record<string, any>;
  toolResult?: any;
  command?: string;
  stdout?: string;
  stderr?: string;
  exitCode: number;
  testPassed?: boolean;
  sentinelScore?: number;
  tokensUsed: number;
  costCents: number;
  costUsd: number;
  timestamp: string;
  signature: string;
}

export * from './PricingEngine';
export * from './EconomicRationalityEngine';
export * from './events/GideonEventBus';
export * from './types/projects';
export * from './types/context';
export * from './types/communications';
export * from './types/evidence';