import { 
  OpportunityRecord, 
  OpportunityStatus, 
  InvestigationContract, 
  ExperimentContract, 
  MissionContract 
} from '@gideon/shared';

export interface TransitionValidationResult {
  allowed: boolean;
  reason?: string;
  violations?: string[];
}

export class OpportunityStateGuard {
  /**
   * Deterministic State Guard: Validates that state transitions strictly
   * meet hard criteria, completely preventing LLM hallucination of state progress.
   */
  public static validateTransition(params: {
    opportunity: OpportunityRecord;
    targetStatus: OpportunityStatus;
    investigationContract?: InvestigationContract;
    experimentContract?: ExperimentContract;
    missionContract?: MissionContract;
  }): TransitionValidationResult {
    const { opportunity, targetStatus, investigationContract, experimentContract, missionContract } = params;
    const currentStatus = opportunity.status;

    // 1. Idempotent same-state check
    if (currentStatus === targetStatus) {
      return { allowed: true };
    }

    const violations: string[] = [];

    switch (targetStatus) {
      case 'TRIAGED':
        if (!opportunity.title || opportunity.title.trim().length === 0) {
          violations.push('Opportunity must have a non-empty title to be TRIAGED.');
        }
        if (!opportunity.source) {
          violations.push('Opportunity must have an identified source to be TRIAGED.');
        }
        break;

      case 'INVESTIGATING':
        if (!investigationContract) {
          violations.push('Cannot transition to INVESTIGATING without an active InvestigationContract.');
        } else {
          if (investigationContract.maxBudgetCents > 500) {
            violations.push(`Investigation budget exceeds $5.00 limit (${(investigationContract.maxBudgetCents / 100).toFixed(2)} requested).`);
          }
          if (investigationContract.maxRuntimeMinutes > 90) {
            violations.push(`Investigation runtime exceeds 90 minutes limit (${investigationContract.maxRuntimeMinutes}m requested).`);
          }
        }
        break;

      case 'VALIDATED':
        // Must have completed research and feasibility checks
        if (!opportunity.evidence || opportunity.evidence.length < 2) {
          violations.push(`VALIDATED state requires at least 2 verified evidence citations (found ${opportunity.evidence?.length || 0}).`);
        }
        if (opportunity.confidence !== undefined && opportunity.confidence < 0.40) {
          violations.push(`VALIDATED state requires minimum 40% confidence (current: ${(opportunity.confidence * 100).toFixed(0)}%).`);
        }
        break;

      case 'EXPERIMENT':
      case 'EXPERIMENT_READY':
      case 'EXPERIMENT_RUNNING':
        if (!experimentContract) {
          violations.push('Cannot transition to EXPERIMENT without an active ExperimentContract.');
        } else {
          if (!experimentContract.hypothesis || experimentContract.hypothesis.length < 10) {
            violations.push('ExperimentContract must include a testable hypothesis.');
          }
          if (experimentContract.spendCapCents > 500) {
            violations.push('Experiment spend cap cannot exceed $5.00.');
          }
        }
        break;

      case 'MISSION_READY':
        // Must be sufficiently confident or productized
        if (opportunity.confidence !== undefined && opportunity.confidence < 0.60 && opportunity.recommendation !== 'PRODUCTIZE') {
          violations.push(`MISSION_READY requires >= 60% confidence (current: ${(opportunity.confidence * 100).toFixed(0)}%).`);
        }
        if (opportunity.expectedValueCents !== undefined && opportunity.expectedValueCents <= 0) {
          violations.push('MISSION_READY requires positive Expected Value (EV > $0).');
        }
        break;

      case 'MONITOR':
        // Allowed if deferral reason or market conditions warrant watching
        if (!opportunity.rejectionReason && !opportunity.metadata?.monitorReason) {
          violations.push('Transition to MONITOR requires an explicit reason (e.g. TIMING_BAD, high CAC, or tech threshold).');
        }
        break;

      case 'REJECTED':
        if (!opportunity.rejectionReason) {
          violations.push('Transition to REJECTED requires an explicit RejectionReason classification.');
        }
        break;

      case 'WON':
        if (!opportunity.metadata?.revenueRealized && opportunity.status !== 'MISSION_READY') {
          violations.push('Cannot mark opportunity as WON without verified mission completion.');
        }
        break;

      case 'PRODUCTIZED':
        if (!opportunity.deliveryVehicle || opportunity.deliveryVehicle !== 'MICRO_SAAS') {
          if (opportunity.deliveryVehicle !== 'TEMPLATE' && opportunity.deliveryVehicle !== 'API_SERVICE') {
            violations.push('PRODUCTIZED state requires a scalable delivery vehicle (MICRO_SAAS, TEMPLATE, or API_SERVICE).');
          }
        }
        break;
    }

    if (violations.length > 0) {
      return {
        allowed: false,
        reason: `Deterministic Guard Rejected Transition: [${currentStatus} -> ${targetStatus}]: ${violations.join(' ')}`,
        violations
      };
    }

    return { allowed: true };
  }
}
