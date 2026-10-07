export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  totalTokens: number;
}

export interface CostCalculation {
  model: string;
  inputCostCents: number;
  outputCostCents: number;
  cacheReadCostCents: number;
  totalCostCents: number;
  totalCostUsd: number;
}

export interface ModelPricingRate {
  inputCentsPer1M: number;
  outputCentsPer1M: number;
  cacheReadCentsPer1M?: number;
}

/**
 * Deterministic pricing engine mapping models to exact cost rates in cents.
 */
export class PricingEngine {
  private static rates: Record<string, ModelPricingRate> = {
    // Gemini 3.7 Flash: $0.075 / 1M in ($0.000075/1k), $0.30 / 1M out ($0.00030/1k)
    'gemini-3.7-flash': { inputCentsPer1M: 7.5, outputCentsPer1M: 30.0, cacheReadCentsPer1M: 1.875 },
    'google/gemini-3.7-flash': { inputCentsPer1M: 7.5, outputCentsPer1M: 30.0, cacheReadCentsPer1M: 1.875 },

    // Gemini 3.5 Flash: $0.075 / 1M in, $0.30 / 1M out
    'gemini-3.5-flash': { inputCentsPer1M: 7.5, outputCentsPer1M: 30.0, cacheReadCentsPer1M: 1.875 },
    'google/gemini-3.5-flash': { inputCentsPer1M: 7.5, outputCentsPer1M: 30.0, cacheReadCentsPer1M: 1.875 },

    // Gemini 2.5 Flash: $0.075 / 1M in, $0.30 / 1M out
    'gemini-2.5-flash': { inputCentsPer1M: 7.5, outputCentsPer1M: 30.0, cacheReadCentsPer1M: 1.875 },
    'google/gemini-2.5-flash': { inputCentsPer1M: 7.5, outputCentsPer1M: 30.0, cacheReadCentsPer1M: 1.875 },

    // Gemini Pro / Standard: $1.25 / 1M in, $5.00 / 1M out
    'gemini-1.5-pro': { inputCentsPer1M: 125.0, outputCentsPer1M: 500.0, cacheReadCentsPer1M: 31.25 },
    'google/gemini-1.5-pro': { inputCentsPer1M: 125.0, outputCentsPer1M: 500.0, cacheReadCentsPer1M: 31.25 },

    // Default rate for unknown models
    'default': { inputCentsPer1M: 10.0, outputCentsPer1M: 40.0, cacheReadCentsPer1M: 2.5 }
  };

  /**
   * Calculates exact cost breakdown in cents and USD.
   */
  public static calculateCost(model: string, usage: TokenUsage): CostCalculation {
    const normalizedModel = model.toLowerCase().trim();
    const rate = this.rates[normalizedModel] || this.rates['default'];

    const inputCostCents = (usage.inputTokens / 1_000_000) * rate.inputCentsPer1M;
    const outputCostCents = (usage.outputTokens / 1_000_000) * rate.outputCentsPer1M;
    const cacheReadCostCents = ((usage.cacheReadTokens || 0) / 1_000_000) * (rate.cacheReadCentsPer1M || 0);

    const totalCostCents = Number((inputCostCents + outputCostCents + cacheReadCostCents).toFixed(6));
    const totalCostUsd = Number((totalCostCents / 100).toFixed(8));

    return {
      model,
      inputCostCents,
      outputCostCents,
      cacheReadCostCents,
      totalCostCents,
      totalCostUsd
    };
  }

  /**
   * Extracts TokenUsage from OpenClaw raw result or envelope.
   */
  public static extractUsageFromRaw(raw: any): TokenUsage {
    const meta = raw?.result?.meta?.agentMeta || raw?.agentMeta || raw?.meta;
    const usage = meta?.usage || raw?.usage;

    const inputTokens = usage?.input ?? raw?.promptTokens ?? 0;
    const outputTokens = usage?.output ?? raw?.completionTokens ?? 0;
    const cacheReadTokens = usage?.cacheRead ?? 0;
    const cacheWriteTokens = usage?.cacheWrite ?? 0;
    const totalTokens = usage?.total ?? (inputTokens + outputTokens);

    return {
      inputTokens,
      outputTokens,
      cacheReadTokens,
      cacheWriteTokens,
      totalTokens
    };
  }
}
