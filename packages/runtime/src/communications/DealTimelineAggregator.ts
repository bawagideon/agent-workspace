import { ConversationStore } from './ConversationStore';

export class DealTimelineAggregator {
  constructor(private store: ConversationStore) {}

  public async getTimeline(params: { opportunityId?: string; projectId?: string; conversationId?: string }): Promise<any[]> {
    return this.getDealTimeline(params);
  }

  public async getDealTimeline(params: { opportunityId?: string; projectId?: string; conversationId?: string }): Promise<any[]> {
    const events: any[] = [];

    let convs = this.store.listConversations();
    if (params.conversationId) {
      convs = convs.filter(c => c.id === params.conversationId);
    } else if (params.projectId) {
      convs = convs.filter(c => c.projectId === params.projectId);
    } else if (params.opportunityId) {
      convs = convs.filter(c => c.opportunityId === params.opportunityId);
    }

    for (const conv of convs) {
      events.push({
        id: `ev_conv_${conv.id}`,
        timestamp: conv.createdAt,
        type: 'COMMUNICATION',
        title: `Thread Started: ${conv.subject}`,
        description: `Channel: ${conv.channel} | Stage: ${conv.stage}`
      });

      const msgs = this.store.listMessages(conv.id);
      for (const m of msgs) {
        events.push({
          id: `ev_msg_${m.id}`,
          timestamp: m.createdAt,
          type: 'COMMUNICATION',
          title: m.direction === 'INBOUND' ? `Inbound from ${m.sender}` : `Outbound to ${m.recipient}`,
          description: m.sanitizedContent ? m.sanitizedContent.slice(0, 150) : ''
        });
      }

      const drafts = this.store.getDrafts(conv.id);
      for (const d of drafts) {
        events.push({
          id: `ev_draft_${d.id}`,
          timestamp: d.createdAt,
          type: 'APPROVAL',
          title: `Draft Created: ${(d as any).proposedSubject || 'Draft'}`,
          description: `Status: ${d.status} | Author: ${d.authorAgent}`
        });
      }
    }

    const audits = this.store.getAuditEvents();
    for (const a of audits) {
      events.push({
        id: `ev_audit_${a.id}`,
        timestamp: a.timestamp,
        type: 'QA_AUDIT',
        title: `Action: ${a.action}`,
        description: `Actor: ${a.actorId} | Target: ${a.targetId}`
      });
    }

    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
}
