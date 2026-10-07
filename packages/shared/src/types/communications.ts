/**
 * ==============================================================================
 * GIDEON AI HQ — PHASE 6.5: COMMUNICATIONS CONTROL PLANE TYPES
 * ==============================================================================
 */

export type ConversationStatus = 'ACTIVE' | 'AWAITING_REPLY' | 'AWAITING_APPROVAL' | 'CLOSED' | 'ARCHIVED';
export type ConversationStage = 'PROSPECTING' | 'PROPOSAL' | 'NEGOTIATION' | 'ACTIVE_PROJECT' | 'COMPLETED';
export type CommunicationChannel = 'DIRECT' | 'EMAIL' | 'TELEGRAM' | 'PORTAL';
export type MessageDirection = 'INBOUND' | 'OUTBOUND';
export type MessageClassification = 'QUESTION' | 'ACCEPTANCE' | 'OBJECTION' | 'STATUS_INQUIRY' | 'CHANGE_REQUEST' | 'INFORMATIONAL' | 'UNTRUSTED_EXTERNAL';
export type AcceptanceConfidence = 'CONFIRMED' | 'AMBIGUOUS' | 'NOT_ACCEPTANCE' | 'NONE';

export type DraftStatus = 
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'DISPATCHING'
  | 'DISPATCHED'
  | 'DELIVERY_FAILED'
  | 'SEND_BLOCKED_POLICY'
  | 'SEND_BLOCKED_IDENTITY'
  | 'SEND_BLOCKED_SCOPE'
  | 'SEND_BLOCKED_APPROVAL'
  | 'DISPATCH_UNCERTAIN';

export interface ContactRecord {
  id: string;
  clientId: string;
  name: string;
  primaryContact: string;
  verifiedChannels: CommunicationChannel[];
  isVerified: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface ConversationRecord {
  id: string;
  opportunityId?: string;
  projectId?: string;
  contactId: string;
  channel: CommunicationChannel;
  externalThreadId: string;
  subject: string;
  status: ConversationStatus;
  stage: ConversationStage;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface ScopeAnalysisResult {
  isWithinScope: boolean;
  scopeDelta?: string;
  estimatedCostDeltaCents?: number;
  recommendation: 'REWORK' | 'CHANGE_ORDER' | 'PROCEED';
  confidence: number;
}

export interface MessageRecord {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  sender: string;
  recipient: string;
  rawContent: string; // Quarantined forensic evidence
  sanitizedContent: string; // Sanitized text
  externalMessageId: string;
  classification?: MessageClassification;
  classificationReason?: string;
  acceptanceConfidence?: AcceptanceConfidence;
  scopeAnalysis?: ScopeAnalysisResult;
  createdAt: string;
}

export interface MessageDraftRecord {
  id: string;
  conversationId: string;
  replyToMessageId?: string;
  draftText: string;
  contentHash: string; // SHA-256 of draftText
  authorAgent: 'atlas' | 'human_operator';
  status: DraftStatus;
  changeOrderCents?: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface MessageApprovalRecord {
  id: string;
  draftId: string;
  draftVersion: number;
  conversationVersion: number;
  contentHash: string;
  recipient: string;
  channel: CommunicationChannel;
  operatorId: string;
  signature: string; // HMAC-SHA256 signature
  expiresAt: string;
  usedAt?: string;
  status: 'ACTIVE' | 'CONSUMED' | 'EXPIRED' | 'REVOKED';
  createdAt: string;
}

export interface OutboundDispatchEnvelope {
  approvalId: string;
  draftId: string;
  conversationId: string;
  draftVersion: number;
  conversationVersion: number;
  recipientAddress: string;
  channel: CommunicationChannel;
  approvedContentHash: string;
  operatorId: string;
  signature: string;
  envelopeSignature?: string;
  expiresAt: string;
  createdAt: string;
}

export interface AuthorizedOutboundMessage {
  dispatchId: string;
  conversationId: string;
  draftId: string;
  draftVersion: number;
  conversationVersion: number;
  recipient: string;
  channel: CommunicationChannel;
  content: string;
  approvedContentHash: string;
  approvalId: string;
  operatorId: string;
  signature: string;
  idempotencyKey: string;
}

export interface ChangeOrderPricing {
  basePriceCents: number;
  computeCostCents: number;
  marginPercent: number;
  requiredDepositCents: number;
  budgetCapCents: number;
  justification: string;
}

export interface DealTimelineEvent {
  id: string;
  timestamp: string;
  type: 'DISCOVERY' | 'COMMUNICATION' | 'APPROVAL' | 'FINANCIAL' | 'PROJECT_OS' | 'QA_AUDIT' | 'DEPLOYMENT' | 'MEMORY';
  title: string;
  actor: string;
  description: string;
  metadata?: Record<string, any>;
}
