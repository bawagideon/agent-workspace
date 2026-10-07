import { LedgerTransaction } from './index';

export interface CapitalAllocationSummary {
  investigationCostCents: number;
  experimentCostCents: number;
  buildCostCents: number;
  totalCostCents: number;
  revenueCollectedCents: number;
  netProfitCents: number;
  grossMarginPercent: number;
  totalHumanMinutes: number;
  verifiedNetRevenuePerHumanHourCents: number;
}

export interface ArchetypeMetric {
  archetype: string;
  totalOpportunities: number;
  completedMissions: number;
  revenueCents: number;
  incurredCostCents: number;
  netProfitCents: number;
  averageMarginPercent: number;
  humanHourReturnCents: number;
}

export class EconomicRationalityEngine {
  /**
   * Computes complete capital allocation and economic rationality metrics.
   */
  public static calculateCapitalAllocation(
    transactions: LedgerTransaction[],
    totalHumanMinutes: number = 30
  ): CapitalAllocationSummary {
    let investigationCostCents = 0;
    let experimentCostCents = 0;
    let buildCostCents = 0;
    let revenueCollectedCents = 0;

    for (const tx of transactions) {
      if (tx.transactionType === 'REVENUE' || tx.transactionType === 'BOUNTY') {
        revenueCollectedCents += tx.amountCents;
      } else if (tx.transactionType === 'TOKEN_COST' || tx.transactionType === 'EXPENSE') {
        const desc = (tx.description || '').toLowerCase();
        if (desc.includes('investigation') || desc.includes('research')) {
          investigationCostCents += tx.amountCents;
        } else if (desc.includes('experiment')) {
          experimentCostCents += tx.amountCents;
        } else {
          buildCostCents += tx.amountCents;
        }
      }
    }

    const totalCostCents = investigationCostCents + experimentCostCents + buildCostCents;
    const netProfitCents = revenueCollectedCents - totalCostCents;
    const grossMarginPercent = revenueCollectedCents > 0
      ? Math.round((netProfitCents / revenueCollectedCents) * 100)
      : 0;

    const humanHours = Math.max(0.1, totalHumanMinutes / 60);
    const verifiedNetRevenuePerHumanHourCents = Math.round(netProfitCents / humanHours);

    return {
      investigationCostCents,
      experimentCostCents,
      buildCostCents,
      totalCostCents,
      revenueCollectedCents,
      netProfitCents,
      grossMarginPercent,
      totalHumanMinutes,
      verifiedNetRevenuePerHumanHourCents
    };
  }

  /**
   * Aggregates profitability by vehicle / opportunity archetype.
   */
  public static computeArchetypeMetrics(
    transactions: LedgerTransaction[]
  ): ArchetypeMetric[] {
    const map: Map<string, { revenue: number; cost: number; count: number; humanMinutes: number }> = new Map();

    const defaultArchetypes = ['MICRO_SAAS', 'API_SERVICE', 'AUTOMATION', 'FREELANCE_DELIVERY', 'TEMPLATE'];
    for (const arch of defaultArchetypes) {
      map.set(arch, { revenue: 0, cost: 0, count: 0, humanMinutes: 30 });
    }

    for (const tx of transactions) {
      const arch = (tx.metadata?.deliveryVehicle || 'FREELANCE_DELIVERY').toUpperCase();
      if (!map.has(arch)) {
        map.set(arch, { revenue: 0, cost: 0, count: 0, humanMinutes: 30 });
      }

      const item = map.get(arch)!;
      if (tx.transactionType === 'REVENUE' || tx.transactionType === 'BOUNTY') {
        item.revenue += tx.amountCents;
      } else {
        item.cost += tx.amountCents;
        item.count++;
      }
    }

    const results: ArchetypeMetric[] = [];
    for (const [archetype, data] of map.entries()) {
      const netProfit = data.revenue - data.cost;
      const margin = data.revenue > 0 ? Math.round((netProfit / data.revenue) * 100) : 0;
      const humanHours = data.humanMinutes / 60;
      const returnPerHour = Math.round(netProfit / humanHours);

      results.push({
        archetype,
        totalOpportunities: data.count,
        completedMissions: data.count,
        revenueCents: data.revenue,
        incurredCostCents: data.cost,
        netProfitCents: netProfit,
        averageMarginPercent: margin,
        humanHourReturnCents: returnPerHour
      });
    }

    return results.sort((a, b) => b.humanHourReturnCents - a.humanHourReturnCents);
  }

  private recordedAllocations: Map<string, number> = new Map();
  private recordedRevenueCents: number = 0;
  private recordedHumanHours: number = 0;

  public recordAllocation(category: string, amountCents: number): void {
    const cur = this.recordedAllocations.get(category) || 0;
    this.recordedAllocations.set(category, cur + amountCents);
  }

  public recordRevenue(revenueCents: number, humanHours: number): void {
    this.recordedRevenueCents += revenueCents;
    this.recordedHumanHours += humanHours;
  }

  public calculateNetRevenuePerHumanHour(): number {
    const totalCost = Array.from(this.recordedAllocations.values()).reduce((a, b) => a + b, 0);
    const net = this.recordedRevenueCents - totalCost;
    const hours = Math.max(0.1, this.recordedHumanHours);
    return Math.round(net / hours);
  }

  public getSummary(): { totalCapitalInvestedCents: number; totalRevenueCollectedCents: number } {
    const totalCost = Array.from(this.recordedAllocations.values()).reduce((a, b) => a + b, 0);
    return {
      totalCapitalInvestedCents: totalCost,
      totalRevenueCollectedCents: this.recordedRevenueCents
    };
  }
}

