import crypto from 'crypto';
import { MessageRecord, ContactRecord } from '@gideon/shared';
import { UntrustedFeedbackSanitizer } from '@gideon/portal';
import { ConversationStore } from './ConversationStore';

export interface InboundPayload {
  externalMessageId?: string;
  conversationId: string;
  sender?: string;
  senderAddress?: string;
  recipient?: string;
  rawContent: string;
  timestamp?: string;
  channelMetadata?: any;
}

export interface IngestionResult {
  message: MessageRecord & { rawContentQuarantined?: boolean };
  contact?: ContactRecord;
  isDuplicate: boolean;
  isVerifiedSender: boolean;
  senderStatus: 'VERIFIED' | 'UNVERIFIED';
  quarantinedRaw: boolean;
  conversation?: any;
}

export class MessageIngestor {
  private inboundRateLimitMap: Map<string, number[]> = new Map();

  constructor(private store: ConversationStore) {}

  public checkInboundRateLimit(sender: string, limit: number = 30): void {
    const now = Date.now();
    const windowMs = 60000;
    const timestamps = (this.inboundRateLimitMap.get(sender) || []).filter(t => now - t < windowMs);
    if (timestamps.length >= limit) {
      throw new Error(`INBOUND_RATE_LIMIT_EXCEEDED: Rate limit of ${limit} messages/min exceeded for sender '${sender}'.`);
    }
    timestamps.push(now);
    this.inboundRateLimitMap.set(sender, timestamps);
  }

  public async ingestInbound(payload: InboundPayload): Promise<IngestionResult> {
    return this.ingestInboundMessage(payload);
  }

  public async ingestInboundMessage(payload: InboundPayload): Promise<IngestionResult> {
    const sender = payload.senderAddress || payload.sender || 'unknown@client.com';
    const externalMessageId = payload.externalMessageId || `msg_ext_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    // 0. Check Deactivated Contact
    const contact = this.store.getContactByPrimary(sender);
    if (contact && (contact as any).isDeactivated) {
      throw new Error(`CONTACT_DEACTIVATED: Message from deactivated contact '${sender}' rejected.`);
    }

    // 1. Inbound Rate Limiting Check
    this.checkInboundRateLimit(sender, 30);

    // 2. Idempotency Check
    const existing = this.store.getMessageByExternalId(externalMessageId);
    if (existing) {
      return {
        message: { ...existing, rawContentQuarantined: true },
        contact,
        isDuplicate: true,
        isVerifiedSender: contact?.isVerified ?? false,
        senderStatus: contact?.isVerified ? 'VERIFIED' : 'UNVERIFIED',
        quarantinedRaw: true
      };
    }

    // 3. Contact Verification Check
    const isVerifiedSender = Boolean(
      contact?.isVerified ||
      (contact as any)?.channels?.some((c: any) => c.address?.toLowerCase() === sender.toLowerCase() && c.isVerified)
    );
    const senderStatus: 'VERIFIED' | 'UNVERIFIED' = isVerifiedSender ? 'VERIFIED' : 'UNVERIFIED';

    // 4. Untrusted Data Boundary & Sanitization
    // Strip null characters, script, style
    const cleanedRaw = payload.rawContent.replace(/\0/g, '');
    const sanitizedObj = UntrustedFeedbackSanitizer.sanitize({
      feedbackText: cleanedRaw
    });

    const sanitizedContent = [
      '<<<UNTRUSTED_CLIENT_MESSAGE>>>',
      `SENDER: ${sender} (Verified: ${isVerifiedSender})`,
      'CONTENT:',
      sanitizedObj.feedbackText,
      '<<<END_UNTRUSTED_CLIENT_MESSAGE>>>'
    ].join('\n');

    // 5. Create Message Record with quarantined rawContent
    const message: MessageRecord & { rawContentQuarantined?: boolean } = {
      id: `msg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      conversationId: payload.conversationId,
      direction: 'INBOUND',
      sender,
      recipient: payload.recipient || 'gideon_operator',
      rawContent: payload.rawContent, // Quarantined forensic evidence
      sanitizedContent,
      externalMessageId,
      createdAt: payload.timestamp || new Date().toISOString()
    };
    message.rawContentQuarantined = true;

    await this.store.saveMessage(message);

    const conv = this.store.getConversation(payload.conversationId);

    return {
      message,
      contact,
      isDuplicate: false,
      isVerifiedSender,
      senderStatus,
      quarantinedRaw: true,
      conversation: conv
    };
  }
}
