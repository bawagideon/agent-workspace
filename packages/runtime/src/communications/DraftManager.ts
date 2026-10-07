import crypto from 'crypto';
import { MessageDraftRecord } from '@gideon/shared';
import { ConversationStore } from './ConversationStore';

export class DraftManager {
  constructor(private store: ConversationStore) {}

  public async createDraft(params: {
    conversationId: string;
    proposedSubject?: string;
    proposedBody: string;
    inReplyToMessageId?: string;
    metadata?: any;
  }): Promise<MessageDraftRecord & { conversationVersion: number; draftVersion: number }> {
    const conv = this.store.getConversation(params.conversationId);
    if (!conv) throw new Error(`Conversation '${params.conversationId}' not found.`);

    // Secret Leakage Check Invariant
    this.checkForSecrets(params.proposedBody);

    const contentHash = crypto.createHash('sha256').update(params.proposedBody).digest('hex');
    const id = `draft_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const draftRecord: MessageDraftRecord & { conversationVersion: number; draftVersion: number; proposedSubject?: string; proposedBody?: string } = {
      id,
      conversationId: params.conversationId,
      replyToMessageId: params.inReplyToMessageId,
      draftText: params.proposedBody,
      contentHash,
      authorAgent: 'atlas',
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      conversationVersion: conv.version,
      draftVersion: 1,
      proposedSubject: params.proposedSubject || 'Message Draft',
      proposedBody: params.proposedBody,
      ...(params.metadata ? { metadata: params.metadata } : {})
    };

    await this.store.saveDraft(draftRecord);
    return draftRecord;
  }

  public async updateDraft(params: {
    draftId: string;
    currentVersion: number;
    proposedBody?: string;
    proposedSubject?: string;
  }): Promise<MessageDraftRecord & { conversationVersion: number; draftVersion: number }> {
    const draft = this.store.getDraft(params.draftId);
    if (!draft) throw new Error(`Draft '${params.draftId}' not found.`);

    if (draft.version !== params.currentVersion) {
      throw new Error(`CONCURRENCY_CONFLICT: Draft version mismatch. Expected ${params.currentVersion}, found ${draft.version}.`);
    }

    const updated = { ...draft };
    if (params.proposedBody) {
      this.checkForSecrets(params.proposedBody);
      updated.draftText = params.proposedBody;
      updated.contentHash = crypto.createHash('sha256').update(params.proposedBody).digest('hex');
      (updated as any).proposedBody = params.proposedBody;
    }
    if (params.proposedSubject) {
      (updated as any).proposedSubject = params.proposedSubject;
    }

    const saved = await this.store.saveDraft(updated, params.currentVersion);
    (saved as any).draftVersion = saved.version;
    return saved as any;
  }

  public async approveDraft(draftId: string, approvalId: string): Promise<void> {
    const draft = this.store.getDraft(draftId);
    if (!draft) throw new Error(`Draft '${draftId}' not found.`);
    draft.status = 'APPROVED';
    (draft as any).approvalId = approvalId;
    await this.store.saveDraft(draft);
  }

  private checkForSecrets(text: string): void {
    const secretPatterns = [
      /sk_live_[0-9a-zA-Z]{24,}/,
      /DB_PASS=[^\s]+/,
      /HMAC_SECRET=[^\s]+/,
      /BEGIN (RSA|EC|PRIVATE) KEY/
    ];

    if (secretPatterns.some(p => p.test(text))) {
      throw new Error('SECRET_LEAKAGE_DETECTED: Draft contains live API keys, credentials, or sensitive secrets.');
    }
  }
}
