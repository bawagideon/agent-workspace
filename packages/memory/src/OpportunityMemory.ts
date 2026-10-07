import { 
  OpportunityRecord, 
  RejectionReason, 
  OpportunityStatus, 
  EvidenceReference 
} from '@gideon/shared';
import { MemoryEngine } from './MemoryEngine';

export interface OpportunityHistoryEntry {
  timestamp: string;
  fromStatus?: OpportunityStatus;
  toStatus: OpportunityStatus;
  actor: string; // 'atlas', 'scout', 'forge', 'human', 'system'
  reason: string;
  evidence?: EvidenceReference[];
  costIncurredCents?: number;
  notes?: string;
}

export interface WhyNotExplanation {
  opportunityId: string;
  title: string;
  currentStatus: OpportunityStatus;
  recommendation: string;
  rejectionReason?: RejectionReason;
  positiveFactors: string[];
  negativeFactors: string[];
  unknowns: string[];
  evidenceCitations: EvidenceReference[];
  experimentsConducted: number;
  totalCostIncurredCents: number;
  reopenCondition?: string;
  summaryAdvice: string;
}

export interface MonitorTrigger {
  signalType: string; // e.g. 'API_PRICE_DROP', 'COMPETITOR_CHANGE', 'NEW_DEMAND_SIGNAL'
  description: string;
  threshold?: number;
  createdAt: string;
}

export class OpportunityMemory {
  private historyStore: Map<string, OpportunityHistoryEntry[]> = new Map();
  private monitorTriggers: Map<string, MonitorTrigger[]> = new Map();
  private storedOpportunities: Map<string, OpportunityRecord> = new Map();

  constructor(private memoryEngine?: MemoryEngine) {}

  public saveOpportunity(opp: OpportunityRecord): void {
    this.storedOpportunities.set(opp.id, { ...opp });
  }

  public getOpportunity(id: string): OpportunityRecord | undefined {
    return this.storedOpportunities.get(id);
  }

  public getAllOpportunities(): OpportunityRecord[] {
    return Array.from(this.storedOpportunities.values());
  }

  public recordTransition(
    opportunityId: string,
    toStatus: OpportunityStatus,
    actor: string,
    reason: string,
    fromStatus?: OpportunityStatus,
    evidence?: EvidenceReference[],
    costIncurredCents: number = 0
  ): OpportunityHistoryEntry {
    const entry: OpportunityHistoryEntry = {
      timestamp: new Date().toISOString(),
      fromStatus,
      toStatus,
      actor,
      reason,
      evidence,
      costIncurredCents
    };

    if (!this.historyStore.has(opportunityId)) {
      this.historyStore.set(opportunityId, []);
    }
    this.historyStore.get(opportunityId)!.push(entry);

    // Update stored opportunity status if exists
    const opp = this.storedOpportunities.get(opportunityId);
    if (opp) {
      opp.status = toStatus;
      opp.updatedAt = entry.timestamp;
    }

    return entry;
  }

  public getHistory(opportunityId: string): OpportunityHistoryEntry[] {
    return this.historyStore.get(opportunityId) || [];
  }

  /**
   * "Why Not?" Query Resolver: Provides structured, evidence-backed
   * rationales for why an opportunity was deferred, monitored, or rejected.
   */
  public resolveWhyNot(opp: OpportunityRecord): WhyNotExplanation {
    const history = this.getHistory(opp.id);
    const totalCost = history.reduce((sum, h) => sum + (h.costIncurredCents || 0), 0);

    const positiveFactors: string[] = [];
    const negativeFactors: string[] = [];

    // Analyze Revenue & Margin
    if (opp.estimatedValueCents > 50000) {
      positiveFactors.push(`Substantial estimated contract value: $${(opp.estimatedValueCents / 100).toFixed(2)}`);
    } else if (opp.estimatedValueCents < 10000) {
      negativeFactors.push(`Low nominal contract value: $${(opp.estimatedValueCents / 100).toFixed(2)}`);
    }

    if (opp.estimatedRecurringRevenueCents && opp.estimatedRecurringRevenueCents > 0) {
      positiveFactors.push(`Recurring revenue potential: $${(opp.estimatedRecurringRevenueCents / 100).toFixed(2)}/mo MRR`);
    }

    // Analyze Technical Difficulty
    if (opp.technicalDifficulty === 'LOW' || opp.technicalDifficulty === 'MEDIUM') {
      positiveFactors.push(`Feasible technical execution profile (${opp.technicalDifficulty} difficulty)`);
    } else if (opp.technicalDifficulty === 'CRITICAL' || opp.technicalDifficulty === 'HIGH') {
      negativeFactors.push(`Significant technical execution hurdles (${opp.technicalDifficulty} difficulty)`);
    }

    // Analyze Competition
    if (opp.competition === 'HIGH') {
      negativeFactors.push('Saturated competitive landscape with established incumbents');
    } else if (opp.competition === 'LOW') {
      positiveFactors.push('Favorable market positioning with low existing competition');
    }

    // Analyze Unknowns & Confidence
    const confidence = opp.confidence ?? (opp.confidenceScore || 0.5);
    if (confidence < 0.6) {
      negativeFactors.push(`High uncertainty profile (Calibrated confidence: ${(confidence * 100).toFixed(0)}%)`);
    } else {
      positiveFactors.push(`High confidence validation (Calibrated confidence: ${(confidence * 100).toFixed(0)}%)`);
    }

    if (opp.unknowns && opp.unknowns.length > 0) {
      negativeFactors.push(`${opp.unknowns.length} critical unknowns require validation: ${opp.unknowns.slice(0, 2).join(', ')}`);
    }

    // Formulate Summary Advice
    let summaryAdvice = '';
    if (opp.status === 'REJECTED') {
      summaryAdvice = `Rejected due to ${opp.rejectionReason || 'adverse economic risk'}. Capital preserved.`;
    } else if (opp.status === 'MONITOR') {
      summaryAdvice = `Placed on active monitor. Prototype feasible, but awaiting favorable external signals before deployment.`;
    } else if (opp.status === 'EXPERIMENT' || opp.status === 'EXPERIMENT_READY') {
      summaryAdvice = `Strong fundamentals but high uncertainty. Recommended action: Execute a bounded $2-$3 experiment to test willingness to pay.`;
    } else if (opp.status === 'VALIDATED' || opp.status === 'MISSION_READY') {
      summaryAdvice = `Fully validated. Recommend immediate mission contract authorization.`;
    } else {
      summaryAdvice = `Under active evaluation.`;
    }

    const triggers = this.monitorTriggers.get(opp.id);
    const reopenCondition = triggers && triggers.length > 0 ? triggers[0].description : undefined;

    return {
      opportunityId: opp.id,
      title: opp.title,
      currentStatus: opp.status,
      recommendation: opp.recommendation || 'MONITOR',
      rejectionReason: opp.rejectionReason,
      positiveFactors,
      negativeFactors,
      unknowns: opp.unknowns || [],
      evidenceCitations: opp.evidence || [],
      experimentsConducted: history.filter((h) => h.toStatus === 'EXPERIMENT' || h.toStatus === 'EXPERIMENT_RUNNING').length,
      totalCostIncurredCents: totalCost,
      reopenCondition,
      summaryAdvice
    };
  }

  /**
   * Registers an automatic monitor trigger so opportunities are never permanently lost.
   */
  public setMonitorTrigger(opportunityId: string, trigger: Omit<MonitorTrigger, 'createdAt'>): void {
    if (!this.monitorTriggers.has(opportunityId)) {
      this.monitorTriggers.set(opportunityId, []);
    }
    this.monitorTriggers.get(opportunityId)!.push({
      ...trigger,
      createdAt: new Date().toISOString()
    });
  }

  public getMonitorTriggers(opportunityId: string): MonitorTrigger[] {
    return this.monitorTriggers.get(opportunityId) || [];
  }

  /**
   * Evaluates an incoming market signal against all monitored opportunities.
   * If a signal matches an opportunity's reopen condition, transitions it to TRIAGED/INVESTIGATING.
   */
  public evaluateSignalForReopen(signal: {
    signalType: string;
    description: string;
    value?: number;
  }): OpportunityRecord[] {
    const reopened: OpportunityRecord[] = [];

    for (const [oppId, triggers] of this.monitorTriggers.entries()) {
      const opp = this.storedOpportunities.get(oppId);
      if (!opp || (opp.status !== 'MONITOR' && opp.status !== 'REJECTED')) {
        continue;
      }

      for (const trigger of triggers) {
        if (trigger.signalType === signal.signalType) {
          // Check optional threshold if applicable
          if (trigger.threshold !== undefined && signal.value !== undefined) {
            if (signal.value > trigger.threshold) continue;
          }

          // Trigger condition met! Reopen opportunity
          const previousStatus = opp.status;
          opp.status = 'TRIAGED';
          opp.recommendation = 'INVESTIGATE';
          opp.updatedAt = new Date().toISOString();

          this.recordTransition(
            opp.id,
            'TRIAGED',
            'system:signal_monitor',
            `Reopened from ${previousStatus}: Matching market signal detected (${signal.description})`,
            previousStatus,
            [{
              claim: `Condition satisfied: ${signal.description}`,
              source: 'market_signal',
              verified: true,
              timestamp: new Date().toISOString()
            }]
          );

          reopened.push(opp);
          break;
        }
      }
    }

    return reopened;
  }

  public evaluateSignal(signal: { signalType: string; description: string; value?: number; numericValue?: number }): OpportunityRecord | undefined {
    const list = this.evaluateSignalForReopen({
      signalType: signal.signalType,
      description: signal.description,
      value: signal.value ?? signal.numericValue
    });
    return list[0];
  }
}

