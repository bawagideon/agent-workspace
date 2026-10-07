import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  ContactRecord,
  ConversationRecord,
  MessageRecord,
  MessageDraftRecord,
  MessageApprovalRecord,
  ConversationStatus,
  ConversationStage
} from '@gideon/shared';

export interface AuditEventRecord {
  id: string;
  timestamp: string;
  action: string;
  actorId: string;
  targetId: string;
  hash: string;
  metadata?: any;
}

export class ConversationStore {
  private contacts: Map<string, ContactRecord> = new Map();
  private conversations: Map<string, ConversationRecord> = new Map();
  private messages: Map<string, MessageRecord> = new Map();
  private drafts: Map<string, MessageDraftRecord> = new Map();
  private approvals: Map<string, MessageApprovalRecord> = new Map();
  private auditEvents: AuditEventRecord[] = [];

  private storageFile: string;

  constructor(customStoragePath?: string) {
    this.storageFile = customStoragePath || path.resolve(process.cwd(), '.gideon/communications_cache.json');
    this.loadState();
  }

  private loadState(): void {
    if (fs.existsSync(this.storageFile)) {
      try {
        const raw = JSON.parse(fs.readFileSync(this.storageFile, 'utf8'));
        if (raw.contacts) raw.contacts.forEach((c: ContactRecord) => this.contacts.set(c.id, c));
        if (raw.conversations) raw.conversations.forEach((c: ConversationRecord) => this.conversations.set(c.id, c));
        if (raw.messages) raw.messages.forEach((m: MessageRecord) => this.messages.set(m.id, m));
        if (raw.drafts) raw.drafts.forEach((d: MessageDraftRecord) => this.drafts.set(d.id, d));
        if (raw.approvals) raw.approvals.forEach((a: MessageApprovalRecord) => this.approvals.set(a.id, a));
        if (raw.auditEvents) this.auditEvents = raw.auditEvents;
      } catch {}
    }
  }

  public persistState(): void {
    try {
      const dir = path.dirname(this.storageFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const data = {
        contacts: Array.from(this.contacts.values()),
        conversations: Array.from(this.conversations.values()),
        messages: Array.from(this.messages.values()),
        drafts: Array.from(this.drafts.values()),
        approvals: Array.from(this.approvals.values()),
        auditEvents: this.auditEvents
      };
      fs.writeFileSync(this.storageFile, JSON.stringify(data, null, 2), 'utf8');
    } catch {}
  }

  // --- Contacts ---
  public async saveContact(contact: ContactRecord): Promise<void> {
    this.contacts.set(contact.id, { ...contact });
    this.persistState();
  }

  public getContact(id: string): ContactRecord | undefined {
    return this.contacts.get(id);
  }

  public getContactByPrimary(primaryContact: string): ContactRecord | undefined {
    return Array.from(this.contacts.values()).find(
      c => c.primaryContact.toLowerCase() === primaryContact.toLowerCase()
    );
  }

  public async deactivateContact(id: string): Promise<void> {
    const contact = this.contacts.get(id);
    if (contact) {
      (contact as any).isDeactivated = true;
      this.persistState();
    }
  }

  // --- Conversations ---
  public async createConversation(params: {
    id?: string;
    opportunityId?: string;
    projectId?: string;
    contactId: string;
    channel: ConversationRecord['channel'];
    externalThreadId: string;
    subject: string;
    stage?: ConversationStage;
  }): Promise<ConversationRecord> {
    const id = params.id || `conv_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const record: ConversationRecord = {
      id,
      opportunityId: params.opportunityId,
      projectId: params.projectId,
      contactId: params.contactId,
      channel: params.channel,
      externalThreadId: params.externalThreadId,
      subject: params.subject,
      status: 'ACTIVE',
      stage: params.stage || 'PROSPECTING',
      lastMessageAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };
    this.conversations.set(id, record);
    this.persistState();
    return record;
  }

  public getConversation(id: string): ConversationRecord | undefined {
    return this.conversations.get(id);
  }

  public listConversations(filter?: { status?: ConversationStatus; opportunityId?: string; projectId?: string }): ConversationRecord[] {
    let list = Array.from(this.conversations.values());
    if (filter?.status) list = list.filter(c => c.status === filter.status);
    if (filter?.opportunityId) list = list.filter(c => c.opportunityId === filter.opportunityId);
    if (filter?.projectId) list = list.filter(c => c.projectId === filter.projectId);
    return list.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }

  public async updateConversation(record: ConversationRecord, expectedVersion: number): Promise<ConversationRecord> {
    const existing = this.conversations.get(record.id);
    if (!existing) throw new Error(`Conversation '${record.id}' not found.`);
    if (existing.version !== expectedVersion) {
      throw new Error(`Concurrency Conflict: Conversation version mismatch. Expected ${expectedVersion}, found ${existing.version}.`);
    }
    const updated: ConversationRecord = {
      ...record,
      version: existing.version + 1,
      updatedAt: new Date().toISOString()
    };
    this.conversations.set(record.id, updated);
    this.persistState();
    return updated;
  }

  // --- Messages ---
  public async saveMessage(message: MessageRecord): Promise<void> {
    this.messages.set(message.id, { ...message });
    const conv = this.conversations.get(message.conversationId);
    if (conv) {
      conv.lastMessageAt = message.createdAt;
      conv.version += 1;
      conv.updatedAt = new Date().toISOString();
    }
    this.persistState();
  }

  public getMessage(id: string): MessageRecord | undefined {
    return this.messages.get(id);
  }

  public getMessageByExternalId(externalId: string): MessageRecord | undefined {
    return Array.from(this.messages.values()).find(m => m.externalMessageId === externalId);
  }

  public listMessages(conversationId: string): MessageRecord[] {
    return Array.from(this.messages.values())
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public getMessages(conversationId: string): MessageRecord[] {
    return this.listMessages(conversationId);
  }

  // --- Drafts ---
  public async saveDraft(draft: MessageDraftRecord, expectedVersion?: number): Promise<MessageDraftRecord> {
    const existing = this.drafts.get(draft.id);
    if (existing && expectedVersion !== undefined && existing.version !== expectedVersion) {
      throw new Error(`Concurrency Conflict: Draft version mismatch. Expected ${expectedVersion}, found ${existing.version}.`);
    }
    const version = existing ? existing.version + 1 : 1;
    const updated: MessageDraftRecord = {
      ...draft,
      version,
      updatedAt: new Date().toISOString()
    };
    this.drafts.set(draft.id, updated);
    this.persistState();
    return updated;
  }

  public getDraft(id: string): MessageDraftRecord | undefined {
    return this.drafts.get(id);
  }

  public getDrafts(conversationId: string): MessageDraftRecord[] {
    return Array.from(this.drafts.values()).filter(d => d.conversationId === conversationId);
  }

  public getActiveDraft(conversationId: string): MessageDraftRecord | undefined {
    return Array.from(this.drafts.values()).find(
      d => d.conversationId === conversationId && ['DRAFT', 'PENDING_APPROVAL', 'APPROVED'].includes(d.status)
    );
  }

  // --- Approvals ---
  public async saveApproval(approval: MessageApprovalRecord): Promise<void> {
    this.approvals.set(approval.id, { ...approval });
    this.persistState();
  }

  public getApproval(id: string): MessageApprovalRecord | undefined {
    return this.approvals.get(id);
  }

  public getApprovalByDraft(draftId: string): MessageApprovalRecord | undefined {
    return Array.from(this.approvals.values()).find(a => a.draftId === draftId && a.status === 'ACTIVE');
  }

  // --- Audit Events ---
  public logAuditEvent(action: string, actorId: string, targetId: string, metadata?: any): AuditEventRecord {
    const id = `audit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const timestamp = new Date().toISOString();
    const payload = `${id}|${timestamp}|${action}|${actorId}|${targetId}`;
    const hash = crypto.createHash('sha256').update(payload).digest('hex');
    const record: AuditEventRecord = { id, timestamp, action, actorId, targetId, hash, metadata };
    this.auditEvents.push(record);
    this.persistState();
    return record;
  }

  public getAuditEvents(): AuditEventRecord[] {
    return [...this.auditEvents];
  }

  public clear(): void {
    this.contacts.clear();
    this.conversations.clear();
    this.messages.clear();
    this.drafts.clear();
    this.approvals.clear();
    this.auditEvents = [];
    if (fs.existsSync(this.storageFile)) {
      try { fs.unlinkSync(this.storageFile); } catch {}
    }
  }
}
