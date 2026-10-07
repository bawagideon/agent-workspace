import crypto from 'crypto';
import { GideonEventBus, ApprovalRequest } from '@gideon/shared';
import { CommandEngine, CommandRequest, CommandResponse } from '@gideon/runtime';

export type ChannelType = 'telegram' | 'whatsapp' | 'webhook' | 'pwa';

export interface InboundChannelMessage {
  channel: ChannelType;
  senderId: string; // e.g. tg user id, phone number, token
  messageId: string;
  text: string;
  callbackData?: string; // For inline button taps, e.g. "APPROVE:appr-1234"
  rawPayload?: Record<string, any>;
  timestamp?: string;
}

export interface OutboundChannelMessage {
  id: string;
  channel: ChannelType;
  recipientId: string;
  text: string;
  buttons?: Array<{ label: string; actionData: string }>;
  status: 'PENDING' | 'SENT' | 'FAILED';
  createdAt: string;
}

export interface ChannelGatewayConfig {
  allowedSenders: string[];
  defaultChannel?: ChannelType;
  telegramBotToken?: string;
  telegramAdminChatId?: string;
}

export class ChannelGatewayAdapter {
  private allowedSenders: Set<string>;
  private outboundLog: OutboundChannelMessage[] = [];
  private eventBus: GideonEventBus = GideonEventBus.getInstance();
  private botToken: string | null = null;
  private adminChatId: string | null = null;
  private isPolling: boolean = false;
  private pollAbortController: AbortController | null = null;

  constructor(
    private commandEngine: CommandEngine,
    config?: Partial<ChannelGatewayConfig>
  ) {
    this.botToken = config?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || null;
    this.adminChatId = config?.telegramAdminChatId || process.env.TELEGRAM_ADMIN_CHAT_ID || null;

    const defaultSenders = [
      'admin',
      'owner',
      'authorized-user',
      '+10000000000',
      'tg-master-admin'
    ];
    if (this.adminChatId) {
      defaultSenders.push(this.adminChatId);
    }
    if (process.env.TELEGRAM_ALLOWED_USERS) {
      const extra = process.env.TELEGRAM_ALLOWED_USERS.split(',').map(s => s.trim()).filter(Boolean);
      defaultSenders.push(...extra);
    }

    this.allowedSenders = new Set(config?.allowedSenders || defaultSenders);

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for proactive approval requests to send mobile notifications
    this.eventBus.subscribe('approval.requested', (event) => {
      const approval: ApprovalRequest = event.payload;
      this.sendApprovalNotification(approval);
    });
  }

  public isSenderAuthorized(senderId: string): boolean {
    return this.allowedSenders.has(senderId);
  }

  public addAuthorizedSender(senderId: string): void {
    this.allowedSenders.add(senderId);
    this.commandEngine.addAllowedSender(senderId);
  }

  public removeAuthorizedSender(senderId: string): void {
    this.allowedSenders.delete(senderId);
    this.commandEngine.removeAllowedSender(senderId);
  }

  /**
   * Processes an incoming message from Telegram, WhatsApp, or webhook.
   */
  public async handleInboundMessage(inbound: InboundChannelMessage): Promise<CommandResponse> {
    const timestamp = inbound.timestamp || new Date().toISOString();

    // 1. Sender Authentication Check
    if (!this.isSenderAuthorized(inbound.senderId)) {
      const deniedResponse: CommandResponse = {
        success: false,
        commandId: `msg-${inbound.messageId}`,
        verb: 'UNAUTHORIZED',
        executionMs: 1,
        message: 'Access Denied: Unrecognized or unauthorized sender identity.',
        error: `UNAUTHORIZED_SENDER: ${inbound.senderId}`
      };

      // Send rejection response back to channel
      this.queueOutboundMessage({
        channel: inbound.channel,
        recipientId: inbound.senderId,
        text: '⛔ Access Denied: Your identity is not authorized to control Gideon AI HQ.'
      });

      return deniedResponse;
    }

    // 2. Handle button callback data (1-tap Approve/Reject)
    let commandText = inbound.text;
    if (inbound.callbackData) {
      const [action, targetId, token] = inbound.callbackData.split(':');
      if (action === 'APPROVE') {
        commandText = `approve ${targetId}${token ? ' ' + token : ''}`;
      } else if (action === 'REJECT') {
        commandText = `reject ${targetId}`;
      }
    }

    // 3. Dispatch to CommandEngine
    const cmdReq: CommandRequest = {
      id: `cmd-${inbound.messageId}`,
      senderId: inbound.senderId,
      source: inbound.channel,
      text: commandText,
      timestamp
    };

    const result = await this.commandEngine.executeCommand(cmdReq);

    // 4. Format and queue reply back to user's messaging channel
    this.queueOutboundMessage({
      channel: inbound.channel,
      recipientId: inbound.senderId,
      text: result.message
    });

    return result;
  }

  /**
   * Dispatches proactive interactive notification card to the user's phone.
   */
  public sendApprovalNotification(
    approval: ApprovalRequest,
    recipientId: string = 'tg-master-admin',
    channel: ChannelType = 'telegram'
  ): OutboundChannelMessage {
    const text = [
      `🚨 **ACTION REQUIRED: Human Approval Gatekeeper**`,
      `• Action: \`${approval.actionType}\` (${approval.riskLevel} Risk)`,
      `• Description: ${approval.description}`,
      `• Agent: \`${approval.agentId}\` | Workspace: \`${approval.workspaceId}\``,
      `• Expires: ${new Date(approval.expiresAt).toLocaleTimeString()}`,
      ``,
      channel === 'telegram'
        ? `Tap a button below to authorize or reject:`
        : `Reply: \`APPROVE ${approval.id}\` or \`REJECT ${approval.id}\``
    ].join('\n');

    const buttons = [
      { label: '✅ APPROVE', actionData: `APPROVE:${approval.id}` },
      { label: '❌ REJECT', actionData: `REJECT:${approval.id}` }
    ];

    return this.queueOutboundMessage({
      channel,
      recipientId,
      text,
      buttons
    });
  }

  public queueOutboundMessage(params: {
    channel: ChannelType;
    recipientId: string;
    text: string;
    buttons?: Array<{ label: string; actionData: string }>;
  }): OutboundChannelMessage {
    const message: OutboundChannelMessage = {
      id: `out-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      channel: params.channel,
      recipientId: params.recipientId,
      text: params.text,
      buttons: params.buttons,
      status: 'SENT', // Interface simulator / transport adapter
      createdAt: new Date().toISOString()
    };

    const targetRecipient = (params.recipientId === 'tg-master-admin' && this.adminChatId)
      ? this.adminChatId
      : params.recipientId;

    if (params.channel === 'telegram' && this.botToken) {
      // Fire-and-forget async HTTP dispatch to Telegram Bot API
      this.sendTelegramMessage(targetRecipient, params.text, params.buttons).catch((err) => {
        console.warn(`[ChannelGateway] Async Telegram dispatch error: ${err.message}`);
      });
    }

    this.outboundLog.push(message);
    this.eventBus.emit('notification.dispatched', message, 'channel_gateway');
    return message;
  }

  public async sendTelegramMessage(
    chatId: string,
    text: string,
    buttons?: Array<{ label: string; actionData: string }>
  ): Promise<boolean> {
    if (!this.botToken) return false;

    const targetChat = (chatId === 'tg-master-admin' && this.adminChatId) ? this.adminChatId : chatId;
    const body: Record<string, any> = {
      chat_id: targetChat,
      text: text,
      parse_mode: 'Markdown'
    };

    if (buttons && buttons.length > 0) {
      body.reply_markup = {
        inline_keyboard: [
          buttons.map((b) => ({ text: b.label, callback_data: b.actionData }))
        ]
      };
    }

    try {
      const resp = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return resp.ok;
    } catch (err: any) {
      console.warn(`[ChannelGateway] Failed to dispatch Telegram message: ${err.message}`);
      return false;
    }
  }

  public async answerCallbackQuery(callbackQueryId: string, text?: string): Promise<boolean> {
    if (!this.botToken) return false;
    try {
      await fetch(`https://api.telegram.org/bot${this.botToken}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callbackQueryId, text })
      });
      return true;
    } catch {
      return false;
    }
  }

  public startTelegramPolling(): void {
    if (!this.botToken) {
      console.log('[ChannelGateway] Telegram bot token not configured. Skipping polling loop.');
      return;
    }

    if (this.isPolling) return;
    this.isPolling = true;
    this.pollAbortController = new AbortController();

    console.log('[ChannelGateway] 📱 Telegram long-polling active. Listening for mobile commands...');

    let offset = 0;

    const pollLoop = async () => {
      while (this.isPolling) {
        try {
          const url = `https://api.telegram.org/bot${this.botToken}/getUpdates?offset=${offset}&timeout=20`;
          const resp = await fetch(url, { signal: this.pollAbortController?.signal });
          if (!resp.ok) {
            await new Promise((r) => setTimeout(r, 5000));
            continue;
          }

          const data = (await resp.json()) as { ok: boolean; result?: any[] };
          if (data.ok && Array.isArray(data.result)) {
            for (const update of data.result) {
              offset = update.update_id + 1;

              if (update.message && update.message.text) {
                const senderId = String(update.message.from?.id || update.message.chat?.id);
                await this.handleInboundMessage({
                  channel: 'telegram',
                  senderId,
                  messageId: String(update.message.message_id),
                  text: update.message.text,
                  timestamp: new Date().toISOString()
                });
              } else if (update.callback_query) {
                const senderId = String(update.callback_query.from?.id);
                const queryId = String(update.callback_query.id);
                await this.answerCallbackQuery(queryId, 'Processing authorization...');
                await this.handleInboundMessage({
                  channel: 'telegram',
                  senderId,
                  messageId: queryId,
                  text: '',
                  callbackData: update.callback_query.data,
                  timestamp: new Date().toISOString()
                });
              }
            }
          }
        } catch (err: any) {
          if (err.name === 'AbortError') break;
          await new Promise((r) => setTimeout(r, 5000));
        }
      }
    };

    pollLoop().catch((err) => {
      console.error('[ChannelGateway] Telegram polling loop error:', err);
    });
  }

  public stopTelegramPolling(): void {
    this.isPolling = false;
    if (this.pollAbortController) {
      this.pollAbortController.abort();
      this.pollAbortController = null;
    }
    console.log('[ChannelGateway] Telegram polling stopped.');
  }

  public getOutboundLog(): OutboundChannelMessage[] {
    return [...this.outboundLog];
  }

  public clearOutboundLog(): void {
    this.outboundLog = [];
  }
}
