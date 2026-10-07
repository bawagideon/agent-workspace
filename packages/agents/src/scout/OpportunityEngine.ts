import crypto from 'crypto';
import { 
  OpportunityRecord, 
  OpportunitySource, 
  OpportunityStatus, 
  OpportunityType,
  DeliveryVehicle 
} from '@gideon/shared';

export interface RawMarketSignal {
  id?: string;
  source: OpportunitySource;
  rawTitle: string;
  rawDescription?: string;
  url?: string;
  budgetString?: string;
  budgetCents?: number;
  tags?: string[];
  clientInfo?: Record<string, any>;
  timestamp?: string;
}

export interface PatternCluster {
  clusterId: string;
  patternName: string;
  matchedOpportunityIds: string[];
  occurrenceCount: number;
  sharedTags: string[];
  suggestedVehicle: DeliveryVehicle;
  productHypothesis: string;
  synthesizedOpportunity?: OpportunityRecord;
}

export class OpportunityEngine {
  private opportunities: Map<string, OpportunityRecord> = new Map();

  /**
   * Dual Intake Entry Point 1: Ingests raw machine signals (bounties, job feeds, web scrapers).
   */
  public ingestMachineSignal(signal: RawMarketSignal): OpportunityRecord {
    const id = signal.id || `opp-scout-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const estimatedValueCents = signal.budgetCents || this.parseBudgetString(signal.budgetString) || 25000; // $250 default

    const record: OpportunityRecord = {
      id,
      title: signal.rawTitle.trim(),
      description: signal.rawDescription?.trim(),
      source: signal.source,
      sourceUrl: signal.url,
      estimatedValueCents,
      confidenceScore: 0.5,
      confidence: 0.5,
      status: 'CAPTURED',
      type: this.inferOpportunityType(signal.rawTitle, signal.rawDescription),
      targetSkills: signal.tags || this.extractKeywords(signal.rawTitle + ' ' + (signal.rawDescription || '')),
      discoveredAt: signal.timestamp || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        rawSignal: signal,
        ingestionType: 'MACHINE_DISCOVERY'
      }
    };

    this.opportunities.set(record.id, record);
    return record;
  }

  /**
   * Dual Intake Entry Point 2: Ingests human intent from Opportunity Inbox or Remote Phone messaging.
   * "Tell Gideon about an idea, lead, or market question."
   */
  public ingestHumanIdea(ideaText: string, submitterId: string = 'owner', estimatedValueCents: number = 50000): OpportunityRecord {
    const id = `opp-human-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const trimmed = ideaText.trim();
    const title = trimmed.length > 70 ? trimmed.substring(0, 67) + '...' : trimmed;

    const record: OpportunityRecord = {
      id,
      title,
      description: ideaText,
      source: 'HUMAN',
      estimatedValueCents,
      confidenceScore: 0.4,
      confidence: 0.4,
      status: 'CAPTURED',
      recommendation: 'INVESTIGATE',
      type: this.inferOpportunityType(trimmed, ''),
      targetSkills: this.extractKeywords(trimmed),
      unknowns: [
        'Actual market demand validation',
        'Competitive density & pricing benchmarks',
        'Customer willingness to pay'
      ],
      discoveredAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        submittedBy: submitterId,
        ingestionType: 'HUMAN_INTENT'
      }
    };

    this.opportunities.set(record.id, record);
    return record;
  }

  public getOpportunity(id: string): OpportunityRecord | undefined {
    return this.opportunities.get(id);
  }

  public getAllOpportunities(): OpportunityRecord[] {
    return Array.from(this.opportunities.values());
  }

  public clusterPatterns(threshold: number = 3): PatternCluster[] {
    return this.detectPatterns(threshold);
  }

  /**
   * Pattern Mining: Identifies repeated customer signals and demand clusters.
   * If >= 3 opportunities share core themes, synthesizes a PRODUCTIZE micro-SaaS opportunity.
   */
  public detectPatterns(threshold: number = 3): PatternCluster[] {
    const all = Array.from(this.opportunities.values());
    const keywordGroups: Map<string, string[]> = new Map();

    // Map keywords to opportunity IDs
    for (const opp of all) {
      const tokens = opp.targetSkills.concat(this.extractKeywords(opp.title));
      const uniqueTokens = Array.from(new Set(tokens.map((t) => t.toLowerCase())));

      for (const token of uniqueTokens) {
        if (token.length < 4) continue; // Skip small words
        if (!keywordGroups.has(token)) {
          keywordGroups.set(token, []);
        }
        keywordGroups.get(token)!.push(opp.id);
      }
    }

    const clusters: PatternCluster[] = [];

    for (const [keyword, oppIds] of keywordGroups.entries()) {
      const uniqueOppIds = Array.from(new Set(oppIds));
      if (uniqueOppIds.length >= threshold) {
        const clusterId = `cluster-${keyword}-${Date.now()}`;
        const matchedOpps = uniqueOppIds.map((id) => this.opportunities.get(id)!).filter(Boolean);

        const patternName = `Automated ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Solution`;
        const totalEstimatedValue = matchedOpps.reduce((sum, o) => sum + (o.estimatedValueCents || 0), 0);

        // Synthesize a Micro-SaaS Product Opportunity
        const synthesizedOpp: OpportunityRecord = {
          id: `opp-prod-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
          title: `Micro-SaaS: ${patternName}`,
          description: `Pattern Detected: ${uniqueOppIds.length} independent signals requested solutions around "${keyword}". High probability for productized micro-SaaS or reusable template.`,
          source: 'INTERNAL',
          type: 'PRODUCT',
          status: 'CAPTURED',
          recommendation: 'PRODUCTIZE',
          deliveryVehicle: 'MICRO_SAAS',
          estimatedValueCents: totalEstimatedValue * 2, // Recurring market value multiplier
          estimatedRecurringRevenueCents: 9900, // $99/mo base
          confidenceScore: 0.75,
          confidence: 0.75,
          targetSkills: [keyword, 'Next.js', 'Automation', 'API'],
          unknowns: ['Optimal pricing tier', 'Self-serve onboarding flow'],
          discoveredAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: {
            clusteredFromOppIds: uniqueOppIds,
            clusterKeyword: keyword
          }
        };

        this.opportunities.set(synthesizedOpp.id, synthesizedOpp);

        clusters.push({
          clusterId,
          patternName,
          matchedOpportunityIds: uniqueOppIds,
          occurrenceCount: uniqueOppIds.length,
          sharedTags: [keyword],
          suggestedVehicle: 'MICRO_SAAS',
          productHypothesis: `Repeated commercial interest across ${uniqueOppIds.length} leads indicates viable niche for an automated SaaS tool.`,
          synthesizedOpportunity: synthesizedOpp
        });
      }
    }

    return clusters;
  }

  private parseBudgetString(str?: string): number | null {
    if (!str) return null;
    const match = str.match(/[\$£€]?\s*([0-9,]+(?:\.[0-9]{2})?)/);
    if (match && match[1]) {
      const num = parseFloat(match[1].replace(/,/g, ''));
      return Math.round(num * 100);
    }
    return null;
  }

  private inferOpportunityType(title: string, desc?: string): OpportunityType {
    const text = (title + ' ' + (desc || '')).toLowerCase();
    if (text.includes('bounty') || text.includes('issue')) return 'BOUNTY';
    if (text.includes('saas') || text.includes('software as a service')) return 'SAAS';
    if (text.includes('api') || text.includes('endpoint')) return 'API_SERVICE';
    if (text.includes('template') || text.includes('boilerplate')) return 'TEMPLATE';
    if (text.includes('automation') || text.includes('bot') || text.includes('script')) return 'AUTOMATION';
    return 'CLIENT_WORK';
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'this', 'that', 'with', 'from', 'have', 'build', 'make', 'create', 
      'client', 'request', 'project', 'system', 'need', 'want', 'looking',
      'help', 'small', 'high', 'good'
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .split(/\s+/);

    const candidates = words.filter((w) => w.length > 3 && !stopWords.has(w));
    return Array.from(new Set(candidates)).slice(0, 6);
  }
}
