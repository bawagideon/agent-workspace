import { z } from 'zod';

// =============================================================================
// 1. RISK & APPROVAL ENUMS & TYPES
// =============================================================================
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ApprovalMode = 'AUTO' | 'PLAN' | 'SESSION' | 'ALWAYS_ASK';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

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
  status: ApprovalStatus;
  expiresAt?: string;
  reviewerNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

// =============================================================================
// 2. RUNNER & MACHINE TYPES
// =============================================================================
export type MachineStatus = 'ONLINE' | 'BUSY' | 'DEGRADED' | 'OFFLINE';

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

export type WorkspaceStatus = 'READY' | 'DIRTY' | 'NEEDS_ATTENTION' | 'UNREACHABLE';

export interface Workspace {
  id: string;
  machineId?: string;
  name: string;
  rootPath: string;
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
  department: 'Development' | 'QA' | 'Management' | 'Career' | 'Media';
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
// 5. TASKS, RUNS, PLANS & STEPS
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
  | 'OBSERVING'
  | 'SELF_REVIEW'
  | 'QA_PENDING'
  | 'QA_EXECUTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'BLOCKED'
  | 'BLOCKED_OFFLINE'
  | 'EMERGENCY_STOPPED';

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

export interface ToolExecution {
  id: string;
  taskRunId: string;
  planStepId?: string;
  toolId: string;
  inputParams: Record<string, any>;
  outputResult?: Record<string, any>;
  status: 'SUCCESS' | 'FAILED' | 'KILLED';
  durationMs: number;
  startedAt: string;
  completedAt?: string;
}

// =============================================================================
// 6. ARTIFACTS & EVENTS
// =============================================================================
export type ArtifactType = 'DIFF' | 'TEST_RESULT' | 'BUILD_LOG' | 'SELF_REVIEW' | 'QA_REPORT' | 'SUMMARY';

export interface TaskArtifact {
  id: string;
  taskId: string;
  taskRunId?: string;
  artifactType: ArtifactType;
  title: string;
  content: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface HQEvent {
  id: string;
  taskId?: string;
  taskRunId?: string;
  agentId?: string;
  machineId?: string;
  eventType: string;
  severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  payload: Record<string, any>;
  createdAt: string;
}

// =============================================================================
// 7. MEMORY & PLAYBOOKS
// =============================================================================
export type MemoryCategory = 'USER' | 'PROJECT' | 'AGENT' | 'LESSON';

export interface MemoryRecord {
  id: string;
  category: MemoryCategory;
  workspaceId?: string;
  agentId?: string;
  key: string;
  value: Record<string, any>;
  confidence: number;
  status: 'PROPOSED' | 'ACTIVE' | 'DISABLED' | 'ARCHIVED';
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
