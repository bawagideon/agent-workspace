import crypto from 'crypto';
import { MessageApprovalRecord, MessageDraftRecord, ConversationRecord, OutboundDispatchEnvelope } from '@gideon/shared';
import { ConversationStore } from './ConversationStore';

export class OutboundAuthorization {
  private secretKey: string;
  private allowedOperators: Set<string>;

  constructor(
    private hmacSecretOrStore?: string | ConversationStore,
    options?: { secretKey?: string; allowedOperators?: string[] }
  ) {
    if (typeof hmacSecretOrStore === 'string') {
      this.secretKey = hmacSecretOrStore;
    } else {
      this.secretKey = options?.secretKey || process.env.HMAC_PLAN_SECRET || process.env.PORTAL_HMAC_SECRET || 'gideon_master_comms_hmac_secret_2026';
    }
    this.allowedOperators = new Set(options?.allowedOperators || ['human_admin', 'operator', 'owner', 'operator_human_007', 'operator_human_command']);
  }

  public authorizeDraft(params: {
    draft: any;
    conversation: ConversationRecord;
    operatorId: string;
    recipientAddress: string;
    notes?: string;
    ttlSeconds?: number;
  }): { approval: MessageApprovalRecord; envelope: OutboundDispatchEnvelope } {
    const { draft, conversation, operatorId, recipientAddress, notes, ttlSeconds = 3600 } = params;

    // 1. Agent != Signer Invariant
    if (operatorId.toLowerCase().includes('atlas') || operatorId.toLowerCase().includes('agent') || !this.allowedOperators.has(operatorId)) {
      throw new Error(`AGENT_CANNOT_AUTHORIZE: Autonomous agents cannot authorize outbound messages. HUMAN_OPERATOR_REQUIRED.`);
    }

    // 2. Draft & Conversation Binding Check
    if (draft.conversationId !== conversation.id) {
      throw new Error('CONVERSATION_ID_MISMATCH: Draft conversation does not match envelope conversation.');
    }

    // 3. Secret Leakage Check
    const textToCheck = draft.draftText || draft.proposedBody || '';
    if (/sk_live_|DB_PASS=/i.test(textToCheck)) {
      throw new Error('SECRET_LEAKAGE_DETECTED: Draft contains live credentials.');
    }

    // 4. Create Approval & Cryptographic Envelope
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    const approvalId = `appr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const draftVersion = draft.draftVersion || draft.version || 1;
    const conversationVersion = draft.conversationVersion || conversation.version || 1;
    const approvedContentHash = draft.contentHash;
    const channel = conversation.channel;

    const signaturePayload = [
      draft.id,
      draftVersion.toString(),
      conversationVersion.toString(),
      approvedContentHash,
      recipientAddress,
      channel,
      operatorId,
      expiresAt
    ].join('|');

    const signature = crypto.createHmac('sha256', this.secretKey).update(signaturePayload).digest('hex');

    const approval: MessageApprovalRecord = {
      id: approvalId,
      draftId: draft.id,
      draftVersion,
      conversationVersion,
      contentHash: approvedContentHash,
      recipient: recipientAddress,
      channel,
      operatorId,
      signature,
      expiresAt,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    const envelope: OutboundDispatchEnvelope = {
      approvalId,
      draftId: draft.id,
      conversationId: conversation.id,
      draftVersion,
      conversationVersion,
      recipientAddress,
      channel,
      approvedContentHash,
      operatorId,
      signature,
      envelopeSignature: signature,
      expiresAt,
      createdAt: new Date().toISOString()
    };

    return { approval, envelope };
  }

  public verifyEnvelope(envelope: OutboundDispatchEnvelope): { isValid: boolean; reason?: string } {
    if (new Date(envelope.expiresAt).getTime() < Date.now()) {
      return { isValid: false, reason: 'EXPIRED: Envelope past TTL.' };
    }

    const signaturePayload = [
      envelope.draftId,
      envelope.draftVersion.toString(),
      envelope.conversationVersion.toString(),
      envelope.approvedContentHash,
      envelope.recipientAddress,
      envelope.channel,
      envelope.operatorId,
      envelope.expiresAt
    ].join('|');

    const expected = crypto.createHmac('sha256', this.secretKey).update(signaturePayload).digest('hex');
    const provided = envelope.envelopeSignature || envelope.signature;

    if (expected !== provided) {
      return { isValid: false, reason: 'SIGNATURE_MISMATCH: Envelope hash or signature invalid.' };
    }

    return { isValid: true };
  }
}
