/**
 * OpportunityIntelligenceTypes.ts
 * Authoritative types for Gideon's Opportunity Intelligence & Sentinel Operating Loop.
 *
 * Core Tenet:
 * Scout discovers -> Sentinel verifies & challenges -> Forge investigates & micro-prototypes
 * -> Sentinel validates -> Ledger prices -> Human approves -> Client offers -> Release Captain deploys.
 */

export type OpportunityLifecycle =
  | 'DISCOVERED'
  | 'IDENTITY_VERIFIED'
  | 'WEBSITE_CAPTURED'
  | 'BUSINESS_MODEL_UNDERSTOOD'
  | 'EVIDENCE_COLLECTED'
  | 'SENTINEL_REVIEW'
  | 'PAIN_HYPOTHESIS'
  | 'FORGE_INVESTIGATION'
  | 'PAIN_CONFIRMED'
  | 'SOLUTION_DESIGNED'
  | 'SOLUTION_READY'
  | 'PRICE_READY'
  | 'PROTOTYPE_DECISION'
  | 'PROTOTYPE_BUILDING'
  | 'DEMO_READY'
  | 'HUMAN_CONTACT_APPROVAL'
  | 'CONTACTED'
  | 'RESPONDED'
  | 'DISCOVERY'
  | 'QUOTE'
  | 'CLIENT_REVIEW'
  | 'APPROVED'
  | 'PAID'
  | 'INTEGRATING'
  | 'QA_VERIFIED'
  | 'DEPLOYED'
  // Terminal / Alternate states
  | 'WATCH'
  | 'ARCHIVED'
  | 'REJECTED'
  | 'NO_RESPONSE'
  | 'LOST';

export type EpistemicClassification = 'FACT' | 'OBSERVATION' | 'OPINION' | 'RECOMMENDATION' | 'PROPOSED_LESSON';

export type SignalType = 'EXPLICIT_DEMAND' | 'CUSTOMER_COMPLAINT' | 'BUSINESS_GROWTH' | 'BAD_CONVERSION' | 'MANUAL_PROCESS';

export interface OpportunityEvidence {
  id: string;
  type: 'WEBSITE' | 'PUBLIC_CONTACT' | 'MAPS' | 'SOCIAL_THREAD' | 'REVIEW' | 'HTTP_AUDIT' | 'CODE_ANALYSIS';
  sourceUrl?: string;
  observation: string;
  classification: EpistemicClassification;
  verifiedAt: string;
  confidence: number; // 0.0 to 1.0
  rawExtract?: string;
}

export interface DiagnosisFacet {
  aspect: string;
  verdict: 'CONFIRMED_ISSUE' | 'OBSERVED_SIGNAL' | 'HYPOTHESIS' | 'OPTIMAL';
  classification?: EpistemicClassification;
  detail: string;
  evidenceRef?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface OpportunityDiagnosis {
  website: DiagnosisFacet[];
  ux: DiagnosisFacet[];
  conversion: DiagnosisFacet[];
  performance: DiagnosisFacet[];
  automation: DiagnosisFacet[];
}

export interface OpportunityIntelligenceBrief {
  dossierId: string;
  businessName: string;
  location: string;
  industry: string;
  website?: string;
  identityChecklist: {
    businessExists: boolean;
    websiteMatches: boolean;
    locationMatches: boolean;
    decisionMakerConfirmed: boolean;
  };
  businessSignals: {
    serviceIdentified: boolean;
    highValueTransaction: boolean;
    publicAcquisitionChannel: boolean;
    growthSignalPresent: boolean;
  };
  painSignals: {
    explicitComplaint: boolean;
    customerFriction: boolean;
    technicalHypothesis: boolean;
    revenueImpactEstimated: boolean;
  };
  websiteAudit: {
    mobileReachable: boolean;
    httpsValid: boolean;
    primaryCtaPresent: boolean;
    slowRouteDetected: boolean;
    weakConversionPath: boolean;
    bookingFailureConfirmed: boolean;
    accessibilityIssue: boolean;
  };
  confidence: {
    identityPercent: number;
    painPercent: number;
    technicalDiagnosisPercent: number;
    commercialOpportunityPercent: number;
  };
  whatWeKnow: string[];
  whatWeDoNotKnow: string[];
  nextAction: 'FORGE_TECHNICAL_AUDIT' | 'MICRO_PROTOTYPE' | 'MOVE_ON' | 'HUMAN_REVIEW';
  timestamp: string;
}

export interface SolutionProposal {
  productName: string;
  objective: string;
  features: string[];
  architecture: string[];
  integrations: string[];
  acceptanceCriteria: string[];
}

export type PrototypeType = 'DIAGNOSTIC_ONLY' | 'MICRO_PROTOTYPE' | 'FULL_SOLUTION';

export interface PrototypeDeliverable {
  id: string;
  type: PrototypeType;
  title: string;
  description: string;
  scope: string;
  deliverablePath?: string;
  sandboxUrl?: string;
  validatedBySentinel: boolean;
  sentinelScore: number;
  qualityChecklist: Array<{ name: string; passed: boolean }>;
  createdAt: string;
}

export interface OpportunityEconomics {
  estimatedBuildHours: number;
  estimatedComputeCostUSD: number;
  proposedPriceUSD: number;
  priceRangeUSD: [number, number];
  depositRequirementUSD: number;
  recurringPriceUSD?: number;
  pricingAssumptions: string[];
  confidence: number;
  pricingRationale: string;
}

export interface OpportunityPattern {
  id: string;
  title: string;
  sharedBottleneck: string;
  signalType: SignalType;
  matchingOpportunityIds: string[];
  recommendedCapability: {
    id: string;
    name: string;
    category: string;
    reason: string;
  };
  reusePotentialCount: number;
  status: 'IDENTIFIED' | 'CAPABILITY_STAGED' | 'INTEGRATED';
  detectedAt: string;
}

export type SentinelNotificationLevel =
  | 'ACTION_REQUIRED'   // 🔴 Human intervention required (e.g. Gate approval, confirmed defect)
  | 'IMPORTANT'         // 🟠 Needs attention (e.g. New high-value discovery)
  | 'OBSERVATION'       // 🟡 Intelligence / cross-opportunity pattern
  | 'COMPLETED'         // 🟢 Useful outcome (e.g. Prototype validated)
  | 'DAILY_INTELLIGENCE'; // 🔵 Aggregated operational briefing

export interface SentinelNotification {
  id: string;
  level: SentinelNotificationLevel;
  type: 'QA_AUDIT' | 'SECURITY' | 'OPPORTUNITY' | 'GATE' | 'PATTERN' | 'OBSERVATION' | 'FLYWEEL';
  title: string;
  message: string;
  fact?: string;
  observation?: string;
  opinion?: string;
  recommendation?: string;
  proposedLesson?: string;
  source: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  evidenceRef?: string;
}

export interface SentinelDailyBrief {
  date: string;
  opportunitiesReviewed: number;
  identityVerified: number;
  painSignalsConfirmed: number;
  prototypesRecommended: number;
  opportunitiesArchived: number;
  reusableCapabilitiesIdentified: number;
  patternsDetected: OpportunityPattern[];
  topNotifications: SentinelNotification[];
  systemHealthScore: number;
}

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
  id: string; // e.g., 'opp-001' to 'opp-050'
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
    signalType: SignalType;
  };
  evidence: OpportunityEvidence[];
  pain: {
    hypothesis: string;
    evidenceBackedFacts: string[];
    confidence: number; // 0 to 100
  };
  diagnosis: OpportunityDiagnosis;
  solution: SolutionProposal;
  prototype?: PrototypeDeliverable;
  intelligenceBrief?: OpportunityIntelligenceBrief;
  economics: OpportunityEconomics;
  lifecycle: OpportunityLifecycle;
  patternId?: string;
  missionId?: string;
  conversationId?: string;
  humanContactApproved?: boolean;
  contactNotes?: string;
  contact?: LeadContact;
}
