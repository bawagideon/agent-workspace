import { 
  DeliveryVehicle, 
  OpportunitySource, 
  OpportunityRecord,
  GideonEventBus 
} from '@gideon/shared';
import { OpportunityMemory } from './OpportunityMemory';

export interface OpportunityOutcome {
  opportunityId: string;
  vehicle: DeliveryVehicle;
  source: OpportunitySource;
  outcome: 'WON' | 'LOST' | 'REJECTED' | 'ABANDONED';
  estimatedValueCents: number;
  actualRevenueCents: number;
  actualCostCents: number;
  humanHoursInvested: number;
  netRevenueCents: number;
  netRevenuePerHourCents: number;
  timestamp: string;
  notes?: string;
}

export interface ArchetypeCalibration {
  vehicle: DeliveryVehicle;
  totalAttempts: number;
  wins: number;
  losses: number;
  winRate: number; // 0.0 - 1.0
  totalActualRevenueCents: number;
  totalCostCents: number;
  totalHumanHours: number;
  avgNetRevenuePerHourCents: number;
  confidenceMultiplier: number; // Bayesian multiplier applied to future opportunity scores
}

export interface RevenueLearningInsights {
  totalOutcomes: number;
  overallWinRate: number;
  totalVerifiedRevenueCents: number;
  totalHumanHours: number;
  overallNetRevenuePerHourCents: number;
  topPerformingVehicle: DeliveryVehicle;
  mostProfitableSource: OpportunitySource;
  recommendedStrategicFocus: string;
  archetypeBreakdown: Record<DeliveryVehicle, ArchetypeCalibration>;
}

export class RevenueLearningEngine {
  private outcomes: Map<string, OpportunityOutcome> = new Map();
  private calibrations: Map<DeliveryVehicle, ArchetypeCalibration> = new Map();
  private eventBus: GideonEventBus = GideonEventBus.getInstance();

  constructor(private opportunityMemory?: OpportunityMemory) {
    this.initializeArchetypes();
  }

  private initializeArchetypes(): void {
    const vehicles: DeliveryVehicle[] = [
      'MICRO_SAAS',
      'TEMPLATE',
      'API_SERVICE',
      'AUTOMATION',
      'FREELANCE_DELIVERY'
    ];

    for (const vehicle of vehicles) {
      this.calibrations.set(vehicle, {
        vehicle,
        totalAttempts: 0,
        wins: 0,
        losses: 0,
        winRate: 0.5, // neutral prior
        totalActualRevenueCents: 0,
        totalCostCents: 0,
        totalHumanHours: 0,
        avgNetRevenuePerHourCents: 5000, // $50/hr baseline
        confidenceMultiplier: 1.0
      });
    }
  }

  /**
   * Records a closed-loop outcome for an opportunity and updates Bayesian calibrations.
   */
  public recordOutcome(params: {
    opportunityId: string;
    vehicle: DeliveryVehicle;
    source: OpportunitySource;
    outcome: 'WON' | 'LOST' | 'REJECTED' | 'ABANDONED';
    estimatedValueCents: number;
    actualRevenueCents: number;
    actualCostCents?: number;
    humanHoursInvested: number;
    notes?: string;
  }): OpportunityOutcome {
    const costCents = params.actualCostCents || 0;
    const netRevenueCents = params.actualRevenueCents - costCents;
    const hours = Math.max(0.1, params.humanHoursInvested);
    const netRevenuePerHourCents = Math.round(netRevenueCents / hours);

    const outcomeRecord: OpportunityOutcome = {
      opportunityId: params.opportunityId,
      vehicle: params.vehicle,
      source: params.source,
      outcome: params.outcome,
      estimatedValueCents: params.estimatedValueCents,
      actualRevenueCents: params.actualRevenueCents,
      actualCostCents: costCents,
      humanHoursInvested: hours,
      netRevenueCents,
      netRevenuePerHourCents,
      timestamp: new Date().toISOString(),
      notes: params.notes
    };

    this.outcomes.set(params.opportunityId, outcomeRecord);

    // Update calibration for vehicle
    this.updateCalibration(params.vehicle, outcomeRecord);

    // Update OpportunityMemory status if present
    if (this.opportunityMemory) {
      const opp = this.opportunityMemory.getOpportunity(params.opportunityId);
      if (opp) {
        opp.status = params.outcome === 'WON' ? 'WON' : params.outcome === 'LOST' ? 'LOST' : 'REJECTED';
        this.opportunityMemory.saveOpportunity(opp);
        this.opportunityMemory.recordTransition(
          opp.id,
          opp.status,
          'atlas:revenue_learning_engine',
          `Outcome recorded: ${params.outcome}. Verified revenue: $${(params.actualRevenueCents / 100).toFixed(2)}. Return/hr: $${(netRevenuePerHourCents / 100).toFixed(2)}.`,
          undefined,
          undefined,
          costCents
        );
      }
    }

    this.eventBus.emit('revenue.outcome_recorded', { outcome: outcomeRecord }, 'revenue_learning_engine');
    return outcomeRecord;
  }

  private updateCalibration(vehicle: DeliveryVehicle, outcome: OpportunityOutcome): void {
    const cal = this.calibrations.get(vehicle) || {
      vehicle,
      totalAttempts: 0,
      wins: 0,
      losses: 0,
      winRate: 0.5,
      totalActualRevenueCents: 0,
      totalCostCents: 0,
      totalHumanHours: 0,
      avgNetRevenuePerHourCents: 5000,
      confidenceMultiplier: 1.0
    };

    cal.totalAttempts += 1;
    if (outcome.outcome === 'WON') {
      cal.wins += 1;
    } else {
      cal.losses += 1;
    }

    cal.winRate = Math.round((cal.wins / cal.totalAttempts) * 100) / 100;
    cal.totalActualRevenueCents += outcome.actualRevenueCents;
    cal.totalCostCents += outcome.actualCostCents;
    cal.totalHumanHours += outcome.humanHoursInvested;

    const netRev = cal.totalActualRevenueCents - cal.totalCostCents;
    cal.avgNetRevenuePerHourCents = cal.totalHumanHours > 0 
      ? Math.round(netRev / cal.totalHumanHours) 
      : 0;

    // Bayesian confidence multiplier:
    // Base 1.0. Up to 1.30x for high win-rate (>=75%), down to 0.75x for poor win-rate (<=25%).
    if (cal.winRate >= 0.75) {
      cal.confidenceMultiplier = 1.30;
    } else if (cal.winRate >= 0.60) {
      cal.confidenceMultiplier = 1.15;
    } else if (cal.winRate <= 0.25) {
      cal.confidenceMultiplier = 0.75;
    } else if (cal.winRate <= 0.40) {
      cal.confidenceMultiplier = 0.88;
    } else {
      cal.confidenceMultiplier = 1.0;
    }

    this.calibrations.set(vehicle, cal);
  }

  public getCalibration(vehicle: DeliveryVehicle): ArchetypeCalibration | undefined {
    return this.calibrations.get(vehicle);
  }

  public getAllCalibrations(): Record<DeliveryVehicle, ArchetypeCalibration> {
    const res: any = {};
    for (const [v, c] of this.calibrations.entries()) {
      res[v] = c;
    }
    return res;
  }

  public getOutcomes(): OpportunityOutcome[] {
    return Array.from(this.outcomes.values());
  }

  /**
   * Generates systemic strategic insights on where Net Revenue per Human Hour is maximized.
   */
  public generateInsights(): RevenueLearningInsights {
    const allOutcomes = Array.from(this.outcomes.values());
    const totalOutcomes = allOutcomes.length;

    const wins = allOutcomes.filter((o) => o.outcome === 'WON').length;
    const overallWinRate = totalOutcomes > 0 ? Math.round((wins / totalOutcomes) * 100) / 100 : 0;

    const totalVerifiedRevenueCents = allOutcomes.reduce((s, o) => s + o.actualRevenueCents, 0);
    const totalCostCents = allOutcomes.reduce((s, o) => s + o.actualCostCents, 0);
    const totalHumanHours = allOutcomes.reduce((s, o) => s + o.humanHoursInvested, 0);

    const netRev = totalVerifiedRevenueCents - totalCostCents;
    const overallNetRevenuePerHourCents = totalHumanHours > 0 
      ? Math.round(netRev / totalHumanHours) 
      : 0;

    // Determine top performing vehicle by net revenue per hour
    let topVehicle: DeliveryVehicle = 'AUTOMATION';
    let maxHourlyReturn = -1;

    for (const [vehicle, cal] of this.calibrations.entries()) {
      if (cal.avgNetRevenuePerHourCents > maxHourlyReturn && cal.wins > 0) {
        maxHourlyReturn = cal.avgNetRevenuePerHourCents;
        topVehicle = vehicle;
      }
    }

    // Determine most profitable source
    const sourceMap: Map<OpportunitySource, number> = new Map();
    for (const o of allOutcomes) {
      const cur = sourceMap.get(o.source) || 0;
      sourceMap.set(o.source, cur + o.netRevenueCents);
    }

    let mostProfitableSource: OpportunitySource = 'UPWORK';
    let maxSourceRev = -1;
    for (const [s, rev] of sourceMap.entries()) {
      if (rev > maxSourceRev) {
        maxSourceRev = rev;
        mostProfitableSource = s;
      }
    }

    let recommendedStrategicFocus = `Double down on ${topVehicle} delivery models via ${mostProfitableSource}.`;
    if (totalOutcomes === 0) {
      recommendedStrategicFocus = 'Baseline phase: prioritize high-margin AUTOMATION and MICRO_SAAS delivery vehicles.';
    }

    return {
      totalOutcomes,
      overallWinRate,
      totalVerifiedRevenueCents,
      totalHumanHours,
      overallNetRevenuePerHourCents,
      topPerformingVehicle: topVehicle,
      mostProfitableSource,
      recommendedStrategicFocus,
      archetypeBreakdown: this.getAllCalibrations()
    };
  }
}
