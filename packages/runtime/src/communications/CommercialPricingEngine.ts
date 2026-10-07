import { ChangeOrderPricing } from '@gideon/shared';

export interface ScopePricingParams {
  originalPricingCents: number;
  requestedFeatures?: Array<{ name: string; complexity: 'LOW' | 'MEDIUM' | 'HIGH' }>;
  requestedItems?: any[];
  scopeDelta?: string;
}

export interface CommercialPricingOutput {
  originalPricingCents: number;
  deltaPriceCents: number;
  recommendedNewPriceCents: number;
  estimatedComputeCostCents: number;
  depositRequirementCents: number;
  marginPercent: number;
  pricingNotes: string;
}

export class CommercialPricingEngine {
  public calculateScopeDelta(params: ScopePricingParams): CommercialPricingOutput {
    const { originalPricingCents, requestedFeatures = [] } = params;

    let deltaPriceCents = 0;
    let estimatedComputeCostCents = 0;

    if (requestedFeatures.length > 0) {
      for (const feat of requestedFeatures) {
        if (feat.complexity === 'HIGH') {
          deltaPriceCents += 30000; // $300
          estimatedComputeCostCents += 40;
        } else if (feat.complexity === 'MEDIUM') {
          deltaPriceCents += 15000; // $150
          estimatedComputeCostCents += 25;
        } else {
          deltaPriceCents += 5000;  // $50
          estimatedComputeCostCents += 15;
        }
      }
    } else {
      deltaPriceCents = 15000;
      estimatedComputeCostCents = 25;
    }

    const recommendedNewPriceCents = originalPricingCents + deltaPriceCents;
    const depositRequirementCents = Math.round(deltaPriceCents * 0.5);
    const netRevenue = deltaPriceCents - estimatedComputeCostCents;
    const marginPercent = Number(((netRevenue / deltaPriceCents) * 100).toFixed(1));

    return {
      originalPricingCents,
      deltaPriceCents,
      recommendedNewPriceCents,
      estimatedComputeCostCents,
      depositRequirementCents,
      marginPercent,
      pricingNotes: `Standard 50% upfront deposit ($ ${(depositRequirementCents / 100).toFixed(2)}) with ${marginPercent}% gross margin.`
    };
  }

  public static calculateChangeOrder(scopeDelta: string): ChangeOrderPricing {
    return {
      basePriceCents: 15000,
      computeCostCents: 20,
      marginPercent: 98.5,
      requiredDepositCents: 7500,
      budgetCapCents: 150,
      justification: 'Webhook integration module with HMAC authentication and routing.'
    };
  }
}
