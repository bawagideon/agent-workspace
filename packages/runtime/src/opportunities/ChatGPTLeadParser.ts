import { OpportunityDossier, OpportunityEvidence, SignalType } from './OpportunityIntelligenceTypes';

export interface ParsedLeadInput {
  name: string;
  location: string;
  investigationReason: string;
  website?: string;
  sourceIndex?: number;
}

export class ChatGPTLeadParser {
  /**
   * Parse reference links at bottom of ChatGPT text:
   * e.g. [1]: https://www.blossommedca.com/contact "Contact Us"
   */
  private static extractReferenceLinks(text: string): Map<string, string> {
    const linkMap = new Map<string, string>();
    const lines = text.split('\n');

    for (const line of lines) {
      const match = line.match(/^\[([0-9a-zA-Z_-]+)\]:\s*(https?:\/\/[^\s]+)/);
      if (match) {
        linkMap.set(match[1], match[2]);
      }
    }

    return linkMap;
  }

  /**
   * Heuristic industry classifier
   */
  private static inferIndustry(name: string, reason: string): string {
    const text = `${name} ${reason}`.toLowerCase();
    if (text.includes('dental') || text.includes('smile') || text.includes('ortho') || text.includes('tooth')) return 'Dental & Healthcare';
    if (text.includes('med') || text.includes('clinic') || text.includes('aesthetic') || text.includes('hair') || text.includes('treatment')) return 'Medical Aesthetics & Healthcare';
    if (text.includes('roof') || text.includes('inspection') || text.includes('cabinet') || text.includes('landscape') || text.includes('paving') || text.includes('clean') || text.includes('masonry')) return 'Home & Property Services';
    if (text.includes('law') || text.includes('legal') || text.includes('attorney')) return 'Legal & Professional Services';
    if (text.includes('finance') || text.includes('advisor') || text.includes('wealth') || text.includes('capital')) return 'Financial Advisory & Wealth';
    if (text.includes('tutor') || text.includes('school') || text.includes('education') || text.includes('course')) return 'Education & Tutoring';
    if (text.includes('jewel') || text.includes('luxury') || text.includes('watch') || text.includes('sofa') || text.includes('custom gift') || text.includes('car hire')) return 'Luxury & High-Ticket Retail';
    if (text.includes('video') || text.includes('production') || text.includes('design') || text.includes('architecture')) return 'Creative & Architecture Services';
    if (text.includes('saas') || text.includes('software') || text.includes('platform') || text.includes('app') || text.includes('labs')) return 'Software & Digital Products';
    return 'High-Ticket B2B & Commercial Services';
  }

  /**
   * Calculate tailored pricing based on market & scope
   */
  private static calculatePricing(name: string, location: string, industry: string, reason: string): {
    buildHours: number;
    proposedPrice: number;
    priceRange: [number, number];
    deposit: number;
    rationale: string;
  } {
    const locLower = location.toLowerCase();
    const isTier1US = locLower.includes('san francisco') || locLower.includes('new york') || locLower.includes('los angeles') || locLower.includes('seattle') || locLower.includes('austin') || locLower.includes('boston');
    const isTier1Europe = locLower.includes('london') || locLower.includes('dublin') || locLower.includes('paris') || locLower.includes('milan') || locLower.includes('toronto') || locLower.includes('sydney');
    
    let basePrice = 2400;
    let hours = 20;

    if (industry.includes('Medical') || industry.includes('Dental') || industry.includes('Legal') || industry.includes('Financial')) {
      basePrice = isTier1US ? 3200 : isTier1Europe ? 2800 : 2200;
      hours = 24;
    } else if (industry.includes('Luxury') || industry.includes('Creative')) {
      basePrice = isTier1US ? 3500 : isTier1Europe ? 3000 : 2500;
      hours = 26;
    } else if (industry.includes('Home & Property')) {
      basePrice = isTier1US ? 2600 : isTier1Europe ? 2200 : 1800;
      hours = 18;
    }

    const minPrice = Math.round(basePrice * 0.75);
    const maxPrice = Math.round(basePrice * 1.25);
    const deposit = Math.round(basePrice * 0.5);

    return {
      buildHours: hours,
      proposedPrice: basePrice,
      priceRange: [minPrice, maxPrice],
      deposit,
      rationale: `Calculated from ${industry} benchmark in ${location} with estimated ${hours}h build scope and 50% upfront deposit.`
    };
  }

  /**
   * Main parsing routine:
   * Parses markdown tables, numbered lists, and bullet points.
   */
  public static parse(rawText: string): ParsedLeadInput[] {
    const linkMap = this.extractReferenceLinks(rawText);
    const results: ParsedLeadInput[] = [];
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

    // 1. Attempt Markdown Table Parsing
    const tableRows = lines.filter(l => l.startsWith('|') && l.endsWith('|'));
    if (tableRows.length >= 2) {
      const headerCols = tableRows[0].split('|').map(c => c.trim()).filter(Boolean);
      let prospectIdx = -1;
      let marketIdx = -1;
      let investigateIdx = -1;

      headerCols.forEach((col, i) => {
        const lower = col.toLowerCase();
        if (lower.includes('prospect') || lower.includes('business') || lower.includes('company') || lower.includes('name')) {
          prospectIdx = i;
        } else if (lower.includes('market') || lower.includes('location') || lower.includes('city')) {
          marketIdx = i;
        } else if (lower.includes('investigate') || lower.includes('issue') || lower.includes('pain') || lower.includes('notes') || lower.includes('what')) {
          investigateIdx = i;
        }
      });

      if (prospectIdx !== -1) {
        for (let i = 1; i < tableRows.length; i++) {
          const row = tableRows[i];
          if (row.includes('---')) continue;
          const cols = row.split('|').map(c => c.trim()).filter(Boolean);
          if (cols.length <= prospectIdx) continue;

          let rawName = cols[prospectIdx] || '';
          let rawLocation = marketIdx !== -1 && cols[marketIdx] ? cols[marketIdx] : 'Global / Remote';
          let rawReason = investigateIdx !== -1 && cols[investigateIdx] ? cols[investigateIdx] : 'Identified business with digital optimization potential.';

          // Extract reference link e.g. [1] or direct link (https://...)
          let website: string | undefined;
          const refMatch = rawReason.match(/\[([0-9a-zA-Z_-]+)\]/);
          if (refMatch && linkMap.has(refMatch[1])) {
            website = linkMap.get(refMatch[1]);
          }

          if (!website) {
            const inlineMatch = rawReason.match(/\((https?:\/\/[^\s\)]+)\)/) || rawName.match(/\((https?:\/\/[^\s\)]+)\)/);
            if (inlineMatch) {
              website = inlineMatch[1];
            }
          }

          // Clean markdown from name & reason
          const cleanName = rawName
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
            .replace(/\[([^\]]+)\]\[[^\]]+\]/g, '$1')
            .replace(/\*\*/g, '')
            .trim();

          const cleanReason = rawReason
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
            .replace(/\[([^\]]+)\]\[[^\]]+\]/g, '$1')
            .replace(/\(\[[^\]]+\]\)/g, '')
            .trim();

          if (cleanName && isNaN(Number(cleanName)) && cleanName.length > 2) {
            results.push({
              name: cleanName,
              location: rawLocation.replace(/\*\*/g, '').trim(),
              investigationReason: cleanReason,
              website,
              sourceIndex: results.length + 1
            });
          }
        }
      }
    }

    // 2. Fallback: Numbered List Parsing if no table detected
    if (results.length === 0) {
      for (const line of lines) {
        const listMatch = line.match(/^(\d+)[\.\)]\s*(.+)/);
        if (listMatch) {
          const content = listMatch[2];
          // Try format: **Business Name** - Market: Description
          const boldMatch = content.match(/\*\*([^*]+)\*\*(?:\s*[-–—|:]\s*|\s*\(([^)]+)\)\s*[-–—|:]?\s*)(.*)/);
          if (boldMatch) {
            const name = boldMatch[1].trim();
            const location = boldMatch[2] ? boldMatch[2].trim() : 'Global / Remote';
            const reason = boldMatch[3] ? boldMatch[3].trim() : 'Identified business with digital optimization potential.';
            
            let website: string | undefined;
            const refMatch = reason.match(/\[([0-9a-zA-Z_-]+)\]/);
            if (refMatch && linkMap.has(refMatch[1])) website = linkMap.get(refMatch[1]);

            results.push({
              name,
              location,
              investigationReason: reason,
              website,
              sourceIndex: results.length + 1
            });
          }
        }
      }
    }

    return results;
  }

  /**
   * Convert parsed leads into full Opportunity Dossiers
   */
  public static convertToDossiers(leads: ParsedLeadInput[], existingCount: number = 0): OpportunityDossier[] {
    const dossiers: OpportunityDossier[] = [];

    leads.forEach((lead, idx) => {
      const numId = existingCount + idx + 1;
      const dossierId = `opp-${String(numId).padStart(3, '0')}`;
      const industry = this.inferIndustry(lead.name, lead.investigationReason);
      const economics = this.calculatePricing(lead.name, lead.location, industry, lead.investigationReason);

      const hasObservableDefect = lead.investigationReason.toLowerCase().includes('error state') || 
        lead.investigationReason.toLowerCase().includes('broken') || 
        lead.investigationReason.toLowerCase().includes('frameset');

      let signalType: SignalType = 'MANUAL_PROCESS';
      if (lead.investigationReason.toLowerCase().includes('conversion') || lead.investigationReason.toLowerCase().includes('error') || lead.investigationReason.toLowerCase().includes('ux')) {
        signalType = 'BAD_CONVERSION';
      } else if (lead.investigationReason.toLowerCase().includes('multi-branch') || lead.investigationReason.toLowerCase().includes('multi-location') || lead.investigationReason.toLowerCase().includes('growth')) {
        signalType = 'BUSINESS_GROWTH';
      } else if (lead.investigationReason.toLowerCase().includes('quote') || lead.investigationReason.toLowerCase().includes('booking') || lead.investigationReason.toLowerCase().includes('schedule')) {
        signalType = 'MANUAL_PROCESS';
      }

      const initialLifecycle = hasObservableDefect ? 'PAIN_CONFIRMED' : (lead.website ? 'WEBSITE_CAPTURED' : 'IDENTITY_VERIFIED');

      const evidenceItem: OpportunityEvidence = {
        id: `ev-ingest-${Date.now()}-${idx}`,
        type: lead.website ? 'WEBSITE' : 'PUBLIC_CONTACT',
        sourceUrl: lead.website,
        observation: lead.investigationReason,
        classification: hasObservableDefect ? 'FACT' : 'OBSERVATION',
        verifiedAt: new Date().toISOString(),
        confidence: hasObservableDefect ? 0.95 : 0.82
      };

      const dossier: OpportunityDossier = {
        id: dossierId,
        business: {
          name: lead.name,
          industry,
          location: lead.location,
          website: lead.website,
          sourceUrls: lead.website ? [lead.website] : []
        },
        discovery: {
          discoveredAt: new Date().toISOString(),
          discoverySource: 'CHATGPT_SCOUT_IMPORT',
          discoveryReason: lead.investigationReason,
          signalType
        },
        evidence: [evidenceItem],
        pain: {
          hypothesis: lead.investigationReason,
          evidenceBackedFacts: hasObservableDefect ? [lead.investigationReason] : [],
          confidence: hasObservableDefect ? 90 : 75
        },
        diagnosis: {
          website: [
            {
              aspect: 'Mobile & Endpoint Reachability',
              verdict: hasObservableDefect ? 'CONFIRMED_ISSUE' : 'OBSERVED_SIGNAL',
              detail: lead.investigationReason,
              severity: hasObservableDefect ? 'HIGH' : 'MEDIUM'
            }
          ],
          ux: [
            {
              aspect: 'Inquiry & Booking Funnel',
              verdict: 'OBSERVED_SIGNAL',
              detail: 'Friction in customer acquisition flow requires technical investigation.',
              severity: 'MEDIUM'
            }
          ],
          conversion: [],
          performance: [],
          automation: []
        },
        solution: {
          productName: `${lead.name} Resilient Intake & Client Portal`,
          objective: `Eliminate acquisition friction and automate client conversion for ${lead.name}.`,
          features: [
            'Resilient zero-drop lead capture',
            'Mobile-optimized 2-step booking flow',
            'Automated SMS/Email instant confirmation'
          ],
          architecture: ['Next.js 14 App Router', 'TypeScript', 'Tailwind CSS', 'Serverless APIs'],
          integrations: ['Stripe Checkout', 'Twilio SMS', 'Calendar Webhook'],
          acceptanceCriteria: [
            'Zero unhandled rejections on mobile viewports',
            'Sub-800ms time-to-interactive',
            'Deterministic offline backup queue'
          ]
        },
        economics: {
          estimatedBuildHours: economics.buildHours,
          estimatedComputeCostUSD: 25,
          proposedPriceUSD: economics.proposedPrice,
          priceRangeUSD: economics.priceRange,
          depositRequirementUSD: economics.deposit,
          pricingAssumptions: [
            `Standard deployment for ${industry} operations`,
            'Zero custom backend infrastructure required'
          ],
          confidence: 85,
          pricingRationale: economics.rationale
        },
        lifecycle: initialLifecycle,
        humanContactApproved: false
      };

      dossiers.push(dossier);
    });

    return dossiers;
  }
}
