import crypto from 'crypto';
import { GideonEventBus, ApprovalRequest, ExecutionEvidence, LedgerTransaction } from '@gideon/shared';
import { Mission } from './MissionEngine';

export type NotificationSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';

export type NotificationType =
  | 'ACTION_REQUIRED'
  | 'MISSION_COMPLETE'
  | 'BLOCKED_ALERT'
  | 'CASH_UPDATE'
  | 'MORNING_BRIEFING';

export interface NotificationCard {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  body: string;
  actions?: Array<{ label: string; actionData: string; isPrimary?: boolean }>;
  metadata?: Record<string, any>;
  createdAt: string;
}

export type NotificationSink = (card: NotificationCard) => void | Promise<void>;

export class NotificationEngine {
  private sinks: Set<NotificationSink> = new Set();
  private notificationHistory: NotificationCard[] = [];
  private eventBus: GideonEventBus = GideonEventBus.getInstance();

  constructor() {
    this.setupAutoSubscriptions();
  }

  public registerSink(sink: NotificationSink): () => void {
    this.sinks.add(sink);
    return () => this.sinks.delete(sink);
  }

  private setupAutoSubscriptions(): void {
    // 1. Listen for approvals
    this.eventBus.subscribe('approval.requested', (event) => {
      const approval: ApprovalRequest = event.payload;
      this.dispatchActionRequired(approval);
    });

    // 2. Listen for mission complete
    this.eventBus.subscribe('mission.completed', (event) => {
      this.dispatchMissionComplete(event.payload);
    });

    // 3. Listen for mission failed
    this.eventBus.subscribe('mission.failed', (event) => {
      this.dispatchBlockedAlert(event.payload.missionId, event.payload.reason);
    });
  }

  public dispatchActionRequired(approval: ApprovalRequest): NotificationCard {
    const card: NotificationCard = {
      id: `notif-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      type: 'ACTION_REQUIRED',
      severity: approval.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
      title: `🚨 Action Required: ${approval.actionType}`,
      body: `Agent '${approval.agentId}' is requesting permission to execute: ${approval.description}. Risk level is ${approval.riskLevel}.`,
      actions: [
        { label: '✅ APPROVE', actionData: `APPROVE:${approval.id}`, isPrimary: true },
        { label: '❌ REJECT', actionData: `REJECT:${approval.id}`, isPrimary: false }
      ],
      metadata: { approvalId: approval.id, taskId: approval.taskId, riskLevel: approval.riskLevel },
      createdAt: new Date().toISOString()
    };

    return this.publishCard(card);
  }

  public dispatchMissionComplete(params: { missionId: string; title?: string; evidence?: ExecutionEvidence }): NotificationCard {
    const card: NotificationCard = {
      id: `notif-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      type: 'MISSION_COMPLETE',
      severity: 'SUCCESS',
      title: `🟢 Mission Complete: ${params.title || params.missionId}`,
      body: `Mission has completed successfully. All QA verification passed. Cryptographic HMAC evidence recorded.${params.evidence ? ` Cost: $${params.evidence.costUsd.toFixed(4)}` : ''}`,
      metadata: { missionId: params.missionId, evidenceId: params.evidence?.id },
      createdAt: new Date().toISOString()
    };

    return this.publishCard(card);
  }

  public dispatchBlockedAlert(missionId: string, reason: string): NotificationCard {
    const card: NotificationCard = {
      id: `notif-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      type: 'BLOCKED_ALERT',
      severity: 'CRITICAL',
      title: `🟡 Workforce Blocked / Alert`,
      body: `Mission [${missionId}] was halted: ${reason}`,
      metadata: { missionId, reason },
      createdAt: new Date().toISOString()
    };

    return this.publishCard(card);
  }

  public dispatchCashUpdate(transactions: LedgerTransaction[]): NotificationCard {
    const totalSpendCents = transactions
      .filter((t) => t.transactionType === 'TOKEN_COST')
      .reduce((sum, t) => sum + t.amountCents, 0);

    const card: NotificationCard = {
      id: `notif-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      type: 'CASH_UPDATE',
      severity: 'INFO',
      title: `💰 Workforce Cash & Burn Update`,
      body: `Total recorded token burn: $${(totalSpendCents / 100).toFixed(4)} across ${transactions.length} operations.`,
      metadata: { totalSpendCents, transactionCount: transactions.length },
      createdAt: new Date().toISOString()
    };

    return this.publishCard(card);
  }

  public dispatchMorningBriefing(summary: {
    activeMissions: number;
    pendingApprovals: number;
    dailySpendCents: number;
  }): NotificationCard {
    const card: NotificationCard = {
      id: `notif-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      type: 'MORNING_BRIEFING',
      severity: 'INFO',
      title: `☀️ Morning Executive Briefing`,
      body: `Good morning. Gideon is online.\n• Active missions: ${summary.activeMissions}\n• Approvals pending: ${summary.pendingApprovals}\n• Daily spend: $${(summary.dailySpendCents / 100).toFixed(4)}`,
      actions: summary.pendingApprovals > 0 ? [{ label: 'Review Approvals', actionData: 'STATUS_APPROVALS' }] : undefined,
      metadata: summary,
      createdAt: new Date().toISOString()
    };

    return this.publishCard(card);
  }

  private publishCard(card: NotificationCard): NotificationCard {
    this.notificationHistory.push(card);
    this.eventBus.emit('notification.dispatched', card, 'notification_engine');

    for (const sink of this.sinks) {
      try {
        sink(card);
      } catch (err) {
        console.error('[NotificationEngine] Sink dispatch error:', err);
      }
    }

    return card;
  }

  public getHistory(limit?: number): NotificationCard[] {
    if (limit && limit > 0) {
      return this.notificationHistory.slice(-limit);
    }
    return [...this.notificationHistory];
  }

  public clearHistory(): void {
    this.notificationHistory = [];
  }
}
