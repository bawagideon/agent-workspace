import { 
  Task, 
  TaskStatus, 
  AgentConstitution, 
  LedgerTransaction, 
  OpportunityRecord, 
  RevenueExperiment,
  PricingEngine,
  ApprovalRequest,
  GideonEventBus
} from '@gideon/shared';
import { PolicyEngine } from '@gideon/policy';
import { MemoryEngine } from '@gideon/memory';
import { JobExecutor, KillSwitch } from '@gideon/runner';
import { AgentRegistry, AgentFactory } from '@gideon/agents';
import { AgentRuntime } from './AgentRuntime';
import { ModelProvider } from './providers/ModelProvider';
import { MissionSupervisor } from './supervisor/MissionSupervisor';

export interface MissionStep {
  id: string;
  assignedAgentId: string;
  title: string;
  goal: string;
  dependencies: string[]; // step IDs that must succeed first
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'BLOCKED';
  result?: any;
  error?: string;
  requiresApproval?: boolean;
  approvalId?: string;
  evidenceHash?: string;
  solutionBrief?: any;
}

export interface Mission {
  id: string;
  title: string;
  objective: string;
  orchestratorId: string; // usually 'atlas'
  status: 'PROPOSED' | 'APPROVED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'ABORTED';
  budgetLimitCents: number;
  currentSpendCents: number;
  revenueCollectedCents: number;
  steps: MissionStep[];
  opportunityId?: string;
  experimentId?: string;
  createdAt: string;
  completedAt?: string;
}

export class MissionEngine {
  private runtime: AgentRuntime;
  private activeMissions: Map<string, Mission> = new Map();
  private ledgerTransactions: LedgerTransaction[] = [];
  private pendingApprovals: Map<string, ApprovalRequest> = new Map();
  private eventBus: GideonEventBus = GideonEventBus.getInstance();

  constructor(
    private policyEngine: PolicyEngine,
    private memoryEngine: MemoryEngine,
    private jobExecutor: JobExecutor,
    modelProvider?: ModelProvider
  ) {
    this.runtime = new AgentRuntime(policyEngine, memoryEngine, jobExecutor, modelProvider);
  }

  /**
   * Decomposes a high-level mission into an executable dependency DAG.
   */
  public createMission(params: {
    id?: string;
    title: string;
    objective: string;
    orchestratorId?: string;
    budgetLimitCents?: number;
    steps?: MissionStep[];
    opportunityId?: string;
    experimentId?: string;
  }): Mission {
    const missionId = params.id || `mission-${Date.now()}`;
    const orchestratorId = params.orchestratorId || 'atlas';

    // Default 4-step workforce pipeline if steps not explicitly provided
    const steps: MissionStep[] = params.steps || [
      {
        id: `${missionId}-step-1`,
        assignedAgentId: 'forge',
        title: 'Implement Core Solution',
        goal: params.objective,
        dependencies: [],
        status: 'PENDING'
      },
      {
        id: `${missionId}-step-2`,
        assignedAgentId: 'sentinel',
        title: 'Independent QA & Security Verification',
        goal: `Conduct adversarial QA audit and run test suite for: ${params.title}`,
        dependencies: [`${missionId}-step-1`],
        status: 'PENDING'
      },
      {
        id: `${missionId}-step-3`,
        assignedAgentId: 'ledger',
        title: 'Financial & Token Cost Audit',
        goal: `Audit token usage and compute mission ROI for: ${params.title}`,
        dependencies: [`${missionId}-step-2`],
        status: 'PENDING'
      },
      {
        id: `${missionId}-step-4`,
        assignedAgentId: 'release',
        title: 'Release Staging Verification',
        goal: `Verify release readiness for: ${params.title}`,
        dependencies: [`${missionId}-step-3`],
        status: 'PENDING'
      }
    ];

    const mission: Mission = {
      id: missionId,
      title: params.title,
      objective: params.objective,
      orchestratorId,
      status: 'PROPOSED',
      budgetLimitCents: params.budgetLimitCents || 2500.00, // $25 cap default
      currentSpendCents: 0,
      revenueCollectedCents: 0,
      steps,
      opportunityId: params.opportunityId,
      experimentId: params.experimentId,
      createdAt: new Date().toISOString()
    };

    this.activeMissions.set(mission.id, mission);
    this.eventBus.emit('mission.created', { missionId: mission.id, title: mission.title }, 'mission_engine');
    return mission;
  }

  /**
   * Pauses an active or proposed mission.
   */
  public pauseMission(missionId: string): boolean {
    const mission = this.activeMissions.get(missionId);
    if (!mission) return false;
    mission.status = 'PAUSED';
    this.eventBus.emit('mission.paused', { missionId }, 'mission_engine');
    return true;
  }

  /**
   * Resumes a paused mission.
   */
  public resumeMission(missionId: string): boolean {
    const mission = this.activeMissions.get(missionId);
    if (!mission) return false;
    mission.status = 'RUNNING';
    this.eventBus.emit('mission.resumed', { missionId }, 'mission_engine');
    return true;
  }

  /**
   * Cancels/aborts a mission.
   */
  public cancelMission(missionId: string, reason: string = 'User requested cancellation'): boolean {
    const mission = this.activeMissions.get(missionId);
    if (!mission) return false;
    mission.status = 'ABORTED';
    this.eventBus.emit('mission.cancelled', { missionId, reason }, 'mission_engine');
    return true;
  }

  /**
   * Pauses all active missions.
   */
  public pauseAll(): number {
    let count = 0;
    for (const mission of this.activeMissions.values()) {
      if (mission.status === 'RUNNING' || mission.status === 'PROPOSED') {
        mission.status = 'PAUSED';
        this.eventBus.emit('mission.paused', { missionId: mission.id }, 'mission_engine');
        count++;
      }
    }
    return count;
  }

  /**
   * Creates an approval request and broadcasts it.
   */
  public createApprovalRequest(params: Omit<ApprovalRequest, 'id' | 'createdAt' | 'status'> & { id?: string }): ApprovalRequest {
    const id = params.id || `appr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const approval: ApprovalRequest = {
      ...params,
      id,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    this.pendingApprovals.set(id, approval);
    this.eventBus.emit('approval.requested', approval, 'mission_engine');
    return approval;
  }

  public getPendingApproval(approvalId: string): ApprovalRequest | undefined {
    return this.pendingApprovals.get(approvalId);
  }

  public getAllPendingApprovals(): ApprovalRequest[] {
    return Array.from(this.pendingApprovals.values()).filter((a) => a.status === 'PENDING');
  }

  public resolveApproval(approvalId: string, status: 'APPROVED' | 'REJECTED', reviewerNotes?: string): ApprovalRequest | null {
    const approval = this.pendingApprovals.get(approvalId);
    if (!approval) return null;

    approval.status = status;
    approval.resolvedAt = new Date().toISOString();
    if (reviewerNotes) {
      approval.reviewerNotes = reviewerNotes;
    }

    if (status === 'APPROVED') {
      this.eventBus.emit('approval.granted', approval, 'mission_engine');
    } else {
      this.eventBus.emit('approval.denied', approval, 'mission_engine');
    }

    return approval;
  }

  /**
   * Executes a mission DAG step-by-step adhering to dependencies and budget caps.
   */
  public async runMission(
    missionId: string,
    workspaceId: string = 'ws-agent-workspace',
    onStepUpdate?: (step: MissionStep, mission: Mission) => void
  ): Promise<{ success: boolean; mission: Mission; error?: string }> {
    const mission = this.activeMissions.get(missionId);
    if (!mission) {
      throw new Error(`Mission not found: ${missionId}`);
    }

    if (KillSwitch.isHalted()) {
      mission.status = 'ABORTED';
      return { success: false, mission, error: 'Emergency Kill Switch is ACTIVE. Mission cannot run.' };
    }

    mission.status = 'RUNNING';
    this.eventBus.emit('mission.started', { missionId }, 'mission_engine');

    for (const step of mission.steps) {
      if (KillSwitch.isHalted()) {
        mission.status = 'ABORTED';
        return { success: false, mission, error: 'Emergency Kill Switch halted mission execution.' };
      }

      if ((mission.status as string) === 'PAUSED') {
        onStepUpdate?.(step, mission);
        return { success: false, mission, error: 'Mission is PAUSED' };
      }

      // Skip steps that are already completed
      if (step.status === 'COMPLETED') {
        continue;
      }

      // Check if step requires approval and is not yet approved
      if (step.requiresApproval && step.approvalId) {
        const appr = this.pendingApprovals.get(step.approvalId);
        if (!appr || appr.status !== 'APPROVED') {
          step.status = 'BLOCKED';
          onStepUpdate?.(step, mission);
          return { success: false, mission, error: `Step waiting for approval: ${step.title}` };
        }
      }

      // 1. Check dependencies
      const depsCompleted = step.dependencies.every((depId) => {
        const dep = mission.steps.find((s) => s.id === depId);
        return dep && dep.status === 'COMPLETED';
      });

      if (!depsCompleted) {
        step.status = 'BLOCKED';
        onStepUpdate?.(step, mission);
        continue;
      }

      // 2. Budget Check (Ledger Rule of Iron)
      if (mission.currentSpendCents >= mission.budgetLimitCents) {
        step.status = 'FAILED';
        step.error = `Mission halted: Exceeded budget limit of $${(mission.budgetLimitCents / 100).toFixed(2)}`;
        mission.status = 'FAILED';
        this.eventBus.emit('mission.failed', { missionId, reason: step.error }, 'mission_engine');
        onStepUpdate?.(step, mission);
        return { success: false, mission, error: step.error };
      }

      // 3. Execute Step via Runtime
      step.status = 'RUNNING';
      onStepUpdate?.(step, mission);

      let stepCompleted = false;
      const stepRetryCounts = new Map<string, number>();

      while (!stepCompleted) {
        const stepTask: Task = {
          id: `task-${step.id}`,
          workspaceId,
          title: step.title,
          goal: step.goal,
          assignedAgentId: step.assignedAgentId,
          department: 'Operations',
          priority: 'HIGH',
          autonomyMode: 'PLAN_APPROVAL',
          status: 'CREATED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        try {
          const result = await this.runtime.executeTask(stepTask);
          if (result.success) {
            step.status = 'COMPLETED';
            step.result = result.summary;
            step.evidenceHash = (result as any)?.evidenceHash;
            step.solutionBrief = (result as any)?.solutionBrief;
            stepCompleted = true;

            // Record token cost & spend in Ledger dynamically
            const tokensUsed = (result as any)?.tokensUsed || 12500;
            const calculatedPricing = PricingEngine.calculateCost((result as any)?.model || 'gemini-3.5-flash', {
              inputTokens: Math.floor(tokensUsed * 0.8),
              outputTokens: Math.floor(tokensUsed * 0.2),
              totalTokens: tokensUsed
            });
            const stepCostCents = (result as any)?.costCents || calculatedPricing.totalCostCents;
            mission.currentSpendCents += stepCostCents;

            this.recordTransaction({
              id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              transactionType: 'TOKEN_COST',
              currency: 'USD',
              amountCents: stepCostCents,
              tokenCount: tokensUsed,
              agentId: step.assignedAgentId,
              taskId: stepTask.id,
              missionId: mission.id,
              status: 'COMMITTED',
              description: `Inference cost for mission step: ${step.title}`,
              createdAt: new Date().toISOString()
            });

            onStepUpdate?.(step, mission);
          } else {
            const rawError = result.summary || 'Step execution returned unsuccessful result.';
            const retries = stepRetryCounts.get(step.id) || 0;
            const diagnosis = MissionSupervisor.diagnoseFailure(step, rawError, mission, retries);
            MissionSupervisor.recordRecoveryAttempt({
              missionId: mission.id,
              stepId: step.id,
              retryCount: retries + 1,
              diagnosis
            });

            if (diagnosis.canAutoRecover && retries < 3) {
              stepRetryCounts.set(step.id, retries + 1);
              step.goal = diagnosis.enrichedGoal;
              step.assignedAgentId = diagnosis.targetRetryAgent;
              onStepUpdate?.(step, mission);
              continue;
            }

            step.status = diagnosis.classification === 'BLOCKED_BY_APPROVAL' ? 'BLOCKED' : 'FAILED';
            step.error = rawError;
            mission.status = step.status === 'BLOCKED' ? 'PAUSED' : 'FAILED';
            this.eventBus.emit('mission.failed', { missionId, reason: step.error }, 'mission_engine');
            onStepUpdate?.(step, mission);
            return { success: false, mission, error: `Step failed: ${step.title}` };
          }
        } catch (err: any) {
          const retries = stepRetryCounts.get(step.id) || 0;
          const diagnosis = MissionSupervisor.diagnoseFailure(step, err.message, mission, retries);
          MissionSupervisor.recordRecoveryAttempt({
            missionId: mission.id,
            stepId: step.id,
            retryCount: retries + 1,
            diagnosis
          });

          if (diagnosis.canAutoRecover && retries < 3) {
            stepRetryCounts.set(step.id, retries + 1);
            step.goal = diagnosis.enrichedGoal;
            step.assignedAgentId = diagnosis.targetRetryAgent;
            onStepUpdate?.(step, mission);
            continue;
          }

          step.status = diagnosis.classification === 'BLOCKED_BY_APPROVAL' ? 'BLOCKED' : 'FAILED';
          step.error = err.message;
          mission.status = step.status === 'BLOCKED' ? 'PAUSED' : 'FAILED';
          this.eventBus.emit('mission.failed', { missionId, reason: err.message }, 'mission_engine');
          onStepUpdate?.(step, mission);
          return { success: false, mission, error: err.message };
        }
      }
    }

    const allCompleted = mission.steps.every((s) => s.status === 'COMPLETED');
    if (allCompleted) {
      mission.status = 'COMPLETED';
      mission.completedAt = new Date().toISOString();
      this.eventBus.emit('mission.completed', { missionId: mission.id }, 'mission_engine');
      return { success: true, mission };
    }

    mission.status = 'FAILED';
    return { success: false, mission, error: 'Not all steps completed successfully' };
  }

  public recordTransaction(tx: LedgerTransaction): void {
    this.ledgerTransactions.push(tx);
  }

  public getTransactions(missionId?: string): LedgerTransaction[] {
    if (missionId) {
      return this.ledgerTransactions.filter((tx) => tx.missionId === missionId);
    }
    return this.ledgerTransactions;
  }

  public getMission(missionId: string): Mission | undefined {
    return this.activeMissions.get(missionId);
  }

  public getAllMissions(): Mission[] {
    return Array.from(this.activeMissions.values());
  }
}

