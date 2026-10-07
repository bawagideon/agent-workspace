import fs from 'fs';
import path from 'path';
import { loopMissionAdapter } from './LoopMissionAdapter';

export interface EvidenceItem {
  type: 'WEBSITE' | 'PUBLIC_CONTACT' | 'MAPS' | 'SOCIAL_THREAD' | 'REVIEW' | 'HTTP_AUDIT' | 'CODE_ANALYSIS';
  classification?: string;
  sourceUrl?: string;
  observation: string;
  verifiedAt: string;
  confidence: number; // 0.0 - 1.0
  rawExtract?: string;
}

export interface DiagnosisItem {
  aspect: string;
  verdict: 'CONFIRMED_ISSUE' | 'OBSERVED_SIGNAL' | 'HYPOTHESIS' | 'OPTIMAL';
  detail: string;
  evidenceRef?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export type OpportunityLifecycle =
  | 'DISCOVERED'
  | 'IDENTITY_VERIFIED'
  | 'WEBSITE_CAPTURED'
  | 'BUSINESS_MODEL_UNDERSTOOD'
  | 'TECHNICAL_AUDIT'
  | 'PAIN_CONFIRMED'
  | 'SOLUTION_READY'
  | 'PRICE_READY'
  | 'REVIEW_REQUIRED'
  | 'CONTACT_APPROVED'
  | 'CONTACTED'
  | 'RESPONDED'
  | 'PROPOSAL'
  | 'WON'
  | 'LOST'
  | 'PAID'
  | 'DELIVERED';

export interface CadenceStep {
  day: number;
  channel: 'EMAIL' | 'LINKEDIN' | 'PHONE' | 'FORM';
  stepName: string;
  touchpointSummary: string;
  templateSubject?: string;
  templateBody: string;
}

export interface LeadContact {
  decisionMaker: {
    name: string;
    title: string;
    role: string;
    linkedinUrl?: string;
    twitterUrl?: string;
    avatar?: string;
  };
  channels: {
    primaryChannel: 'EMAIL' | 'LINKEDIN' | 'PHONE' | 'FORM';
    directEmail: string;
    phone: string;
    contactFormUrl?: string;
    officeAddress: string;
    timeZone: string;
    preferredOutreachWindow: string;
    verified: boolean;
  };
  outreach: {
    primaryAngle: string;
    hook: string;
    cadence: CadenceStep[];
    deliverableOffer: string;
  };
  communicationIntegration: {
    contactId: string;
    conversationId: string;
    draftId?: string;
    status: 'NOT_STARTED' | 'DRAFT_STAGED' | 'PENDING_APPROVAL' | 'APPROVED' | 'DISPATCHED' | 'IN_CONVERSATION';
    lastAuditHash?: string;
  };
}

export interface OpportunityDossier {
  id: string;
  business: {
    name: string;
    industry: string;
    location: string;
    website?: string;
    sourceUrls: string[];
  };
  discovery: {
    discoveredAt: string;
    discoverySource: string;
    discoveryReason: string;
    signalType: 'EXPLICIT_DEMAND' | 'CUSTOMER_COMPLAINT' | 'BUSINESS_GROWTH' | 'BAD_CONVERSION' | 'MANUAL_PROCESS';
  };
  evidence: EvidenceItem[];
  pain: {
    hypothesis: string;
    evidenceBackedFacts: string[];
    confidence: number; // 0 - 100
  };
  diagnosis: {
    website: DiagnosisItem[];
    ux: DiagnosisItem[];
    conversion: DiagnosisItem[];
    performance: DiagnosisItem[];
    automation: DiagnosisItem[];
  };
  solution: {
    productName: string;
    objective: string;
    features: string[];
    architecture: string[];
    integrations: string[];
    acceptanceCriteria: string[];
  };
  economics: {
    estimatedBuildHours: number;
    estimatedCostUSD?: number;
    estimatedComputeCostUSD?: number;
    proposedPriceUSD: number;
    priceRangeUSD: [number, number];
    depositRequirementUSD: number;
    recurringPriceUSD?: number;
    pricingAssumptions: string[];
    confidence: number;
    pricingRationale: string;
  };
  lifecycle: OpportunityLifecycle;
  missionId?: string;
  conversationId?: string;
  contact?: LeadContact;
  prototype?: any;
  patternId?: string;
}

function getGideonPath(fileName: string): string {
  const candidates = [
    path.resolve(process.cwd(), '../../.gideon', fileName),
    path.resolve(process.cwd(), '../.gideon', fileName),
    path.resolve(process.cwd(), '.gideon', fileName),
    path.resolve('c:/Users/DELL/agent-workspace/.gideon', fileName)
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  for (const dir of [
    path.resolve(process.cwd(), '../../.gideon'),
    path.resolve(process.cwd(), '../.gideon'),
    path.resolve(process.cwd(), '.gideon'),
    'c:/Users/DELL/agent-workspace/.gideon'
  ]) {
    if (fs.existsSync(dir)) {
      return path.join(dir, fileName);
    }
  }
  return path.join(process.cwd(), '.gideon', fileName);
}

export class OpportunityDossierAdapter {
  private static instance: OpportunityDossierAdapter;
  private dossiersCache: OpportunityDossier[] = [];

  private constructor() {
    this.loadDossiers();
  }

  public static getInstance(): OpportunityDossierAdapter {
    if (!OpportunityDossierAdapter.instance) {
      OpportunityDossierAdapter.instance = new OpportunityDossierAdapter();
    }
    return OpportunityDossierAdapter.instance;
  }

  public loadDossiers(): OpportunityDossier[] {
    try {
      const filePath = getGideonPath('scout_opportunity_dossiers.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        this.dossiersCache = JSON.parse(raw);
        return this.dossiersCache;
      }
    } catch (err) {
      console.warn('Failed to read dossiers file:', err);
    }
    return [];
  }

  private persistDossiers() {
    try {
      const filePath = getGideonPath('scout_opportunity_dossiers.json');
      fs.writeFileSync(filePath, JSON.stringify(this.dossiersCache, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to write dossiers file:', err);
    }
  }

  public getAll(filter?: {
    lifecycle?: OpportunityLifecycle;
    signalType?: string;
    locationQuery?: string;
    search?: string;
  }): OpportunityDossier[] {
    this.loadDossiers();
    let result = [...this.dossiersCache];

    if (filter?.lifecycle) {
      result = result.filter(d => d.lifecycle === filter.lifecycle);
    }
    if (filter?.signalType && filter.signalType !== 'ALL') {
      result = result.filter(d => d.discovery.signalType === filter.signalType);
    }
    if (filter?.locationQuery && filter.locationQuery !== 'ALL') {
      result = result.filter(d => d.business.location.toLowerCase().includes(filter.locationQuery!.toLowerCase()));
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(d =>
        d.business.name.toLowerCase().includes(q) ||
        d.business.industry.toLowerCase().includes(q) ||
        d.business.location.toLowerCase().includes(q) ||
        d.solution.productName.toLowerCase().includes(q) ||
        d.pain.hypothesis.toLowerCase().includes(q)
      );
    }

    return result;
  }

  public getById(id: string): OpportunityDossier | undefined {
    this.loadDossiers();
    return this.dossiersCache.find(d => d.id === id);
  }

  public updateLifecycle(id: string, newLifecycle: OpportunityLifecycle): OpportunityDossier | null {
    this.loadDossiers();
    const dossier = this.dossiersCache.find(d => d.id === id);
    if (!dossier) return null;

    dossier.lifecycle = newLifecycle;
    this.persistDossiers();
    return dossier;
  }

  public addEvidence(id: string, evidenceItem: EvidenceItem): OpportunityDossier | null {
    this.loadDossiers();
    const dossier = this.dossiersCache.find(d => d.id === id);
    if (!dossier) return null;

    dossier.evidence.push(evidenceItem);
    this.persistDossiers();
    return dossier;
  }

  public addDossier(dossier: OpportunityDossier): OpportunityDossier {
    this.loadDossiers();
    this.dossiersCache.unshift(dossier);
    this.persistDossiers();
    return dossier;
  }

  /**
   * Converts an opportunity into a real BUILD mission in Loop 1
   * without autonomous money spending or outbound communication.
   */
  public async createBuildMission(dossierId: string): Promise<{ success: boolean; missionId?: string; error?: string }> {
    this.loadDossiers();
    const dossier = this.dossiersCache.find(d => d.id === dossierId);
    if (!dossier) {
      return { success: false, error: `Dossier ${dossierId} not found.` };
    }

    if (dossier.missionId) {
      return { success: true, missionId: dossier.missionId };
    }

    // Provision a clean Build mission in Loop 1
    const missionTitle = `Build: ${dossier.solution.productName}`;
    const missionObjective = `Engineer targeted solution for ${dossier.business.name} (${dossier.business.location}). Objective: ${dossier.solution.objective}. Features: ${dossier.solution.features.join('; ')}. Architecture: ${dossier.solution.architecture.join(', ')}.`;

    const projectSlug = `solution-${dossier.id.toLowerCase()}-${dossier.business.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20)}`;

    const newMission = await loopMissionAdapter.createMission({
      loop: 'BUILD',
      title: missionTitle,
      objective: missionObjective,
      projectId: projectSlug,
      riskLevel: 'LOW',
      workforce: ['atlas', 'forge', 'sentinel'],
      constraints: 'Follow solution acceptance criteria. Human review strictly required before client deployment.'
    });

    // Link back to dossier
    dossier.missionId = newMission.id;
    dossier.conversationId = newMission.conversationId;
    if (dossier.lifecycle === 'DISCOVERED' || dossier.lifecycle === 'IDENTITY_VERIFIED' || dossier.lifecycle === 'WEBSITE_CAPTURED' || dossier.lifecycle === 'BUSINESS_MODEL_UNDERSTOOD') {
      dossier.lifecycle = 'SOLUTION_READY';
    }
    this.persistDossiers();

    // Seed conversation with full technical dossier context
    try {
      const convFile = getGideonPath('conversations.json');
      if (fs.existsSync(convFile)) {
        const convData = JSON.parse(fs.readFileSync(convFile, 'utf8'));
        const convKey = newMission.conversationId;
        const initialBrief = `## Opportunity Solution Brief: ${dossier.business.name}
* **Location**: ${dossier.business.location}
* **Industry**: ${dossier.business.industry}
* **Verified Signal**: ${dossier.discovery.discoveryReason} (${dossier.discovery.signalType})
* **Identified Pain**: ${dossier.pain.hypothesis}

### Solution Architecture
* **Product**: ${dossier.solution.productName}
* **Stack**: ${dossier.solution.architecture.join(', ')}
* **Key Features**:
${dossier.solution.features.map(f => `  • ${f}`).join('\n')}

### Acceptance Criteria
${dossier.solution.acceptanceCriteria.map(c => `  ✓ ${c}`).join('\n')}

### Ledger Economic Profile
* **Target Price**: $${dossier.economics.proposedPriceUSD.toLocaleString()} USD (Range: $${dossier.economics.priceRangeUSD[0]} - $${dossier.economics.priceRangeUSD[1]})
* **Estimated Effort**: ${dossier.economics.estimatedBuildHours} hours
* **Rationale**: ${dossier.economics.pricingRationale}

Atlas and Forge are provisioned to architect and implement this system under Sentinel QA inspection.`;

        convData[convKey] = [
          {
            id: `msg-${Date.now()}-brief`,
            sender: 'scout',
            recipient: 'atlas',
            content: initialBrief,
            timestamp: new Date().toISOString()
          }
        ];
        fs.writeFileSync(convFile, JSON.stringify(convData, null, 2), 'utf8');
      }
    } catch (err) {
      console.warn('Failed to seed dossier conversation brief:', err);
    }

    return { success: true, missionId: newMission.id };
  }
}

export const opportunityDossierAdapter = OpportunityDossierAdapter.getInstance();
