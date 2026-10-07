import crypto from 'crypto';
import { ConversationStore } from './ConversationStore';
import { OutboundAuthorization } from './OutboundAuthorization';

export class ChannelDispatcher {
  private adapters: Map<string, any> = new Map();
  private usedEnvelopes: Set<string> = new Set();
  private outboundRateLimitMap: Map<string, number[]> = new Map();

  constructor(
    private store: ConversationStore,
    private auth?: OutboundAuthorization
  ) {}

  public registerAdapter(adapter: any): void {
    this.adapters.set(adapter.channelName.toUpperCase(), adapter);
  }

  public checkOutboundRateLimit(conversationId: string, limit: number = 20): void {
    const now = Date.now();
    const windowMs = 60000;
    const timestamps = (this.outboundRateLimitMap.get(conversationId) || []).filter(t => now - t < windowMs);
    if (timestamps.length >= limit) {
      throw new Error(`RATE_LIMIT_EXCEEDED: Outbound rate limit of ${limit} messages/min exceeded for conversation '${conversationId}'.`);
    }
    timestamps.push(now);
    this.outboundRateLimitMap.set(conversationId, timestamps);
  }

  public async dispatch(params: {
    envelope: any;
    approval: any;
    draft: any;
    conversation: any;
  }): Promise<{ success: boolean; status: string; externalDeliveryId?: string; channel?: string; error?: string }> {
    const { envelope, approval, draft, conversation } = params;

    // 1. Anti-Replay Check
    const envelopeKey = `${envelope.approvalId}_${envelope.envelopeSignature || envelope.signature}`;
    if (this.usedEnvelopes.has(envelopeKey) || approval.status === 'CONSUMED' || approval.usedAt) {
      throw new Error('ENVELOPE_ALREADY_USED: Anti-replay protection blocked duplicate dispatch.');
    }

    // 2. Outbound Rate Limit Check
    this.checkOutboundRateLimit(conversation.id, 20);

    // 3. Mark Envelope as Used immediately to ensure idempotency under concurrency
    this.usedEnvelopes.add(envelopeKey);
    approval.status = 'CONSUMED';
    approval.usedAt = new Date().toISOString();
    await this.store.saveApproval(approval);

    // 4. Find Adapter
    const channel = (conversation.channel || 'EMAIL').toUpperCase();
    const adapter = this.adapters.get(channel) || this.adapters.values().next().value;
    if (!adapter) {
      throw new Error(`No adapter registered for channel ${channel}`);
    }

    // 5. Send through adapter
    try {
      const subject = (draft.proposedSubject || conversation.subject || '').replace(/[\r\n]/g, '');
      const body = draft.draftText || draft.proposedBody || '';

      const sendRes = await adapter.sendMessage({
        recipient: envelope.recipientAddress || approval.recipient,
        subject,
        body,
        envelope
      });

      if (sendRes.uncertain) {
        draft.status = 'DISPATCH_UNCERTAIN';
        await this.store.saveDraft(draft);
        this.store.logAuditEvent('DISPATCH_UNCERTAIN', envelope.operatorId, draft.id, { error: sendRes.error });
        return { success: false, status: 'DISPATCH_UNCERTAIN', error: sendRes.error };
      }

      if (!sendRes.success) {
        draft.status = 'DELIVERY_FAILED';
        await this.store.saveDraft(draft);
        return { success: false, status: 'FAILED', error: sendRes.error };
      }

      draft.status = 'DISPATCHED';
      await this.store.saveDraft(draft);

      // Record outbound message in store
      await this.store.saveMessage({
        id: `msg_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        conversationId: conversation.id,
        direction: 'OUTBOUND',
        sender: 'gideon_operator',
        recipient: envelope.recipientAddress || approval.recipient,
        rawContent: body,
        sanitizedContent: body,
        externalMessageId: sendRes.externalMessageId || `ext_${Date.now()}`,
        createdAt: new Date().toISOString()
      });

      this.store.logAuditEvent('DISPATCH_SUCCESS', envelope.operatorId, draft.id, { externalMessageId: sendRes.externalMessageId });

      return {
        success: true,
        status: 'DELIVERED',
        externalDeliveryId: sendRes.externalMessageId,
        channel
      };
    } catch (err: any) {
      draft.status = 'DISPATCH_UNCERTAIN';
      await this.store.saveDraft(draft);
      return { success: false, status: 'DISPATCH_UNCERTAIN', error: err.message };
    }
  }

  public async reconcileUncertainDispatch(params: {
    draftId: string;
    resolution: 'CONFIRMED_SENT' | 'CONFIRMED_FAILED' | 'STILL_UNKNOWN';
    operatorId: string;
    notes?: string;
  }): Promise<any> {
    const draft = this.store.getDraft(params.draftId);
    if (!draft) throw new Error(`Draft '${params.draftId}' not found.`);

    if (params.resolution === 'CONFIRMED_SENT') {
      draft.status = 'DISPATCHED';
    } else if (params.resolution === 'CONFIRMED_FAILED') {
      draft.status = 'DELIVERY_FAILED';
    }

    await this.store.saveDraft(draft);
    this.store.logAuditEvent('RECONCILE_UNCERTAIN_DISPATCH', params.operatorId, draft.id, params);
    return draft;
  }
}
