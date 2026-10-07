import crypto from 'crypto';

export type GideonEventType =
  | 'command.received'
  | 'command.authorized'
  | 'command.rejected'
  | 'mission.created'
  | 'mission.started'
  | 'mission.paused'
  | 'mission.resumed'
  | 'mission.cancelled'
  | 'mission.completed'
  | 'mission.failed'
  | 'approval.requested'
  | 'approval.granted'
  | 'approval.denied'
  | 'killswitch.triggered'
  | 'killswitch.reset'
  | 'notification.dispatched'
  | 'worker.spawned'
  | 'worker.completed'
  | 'revenue.outcome_recorded'
  | (string & {});

export interface GideonEvent<T = any> {
  id: string;
  type: GideonEventType;
  payload: T;
  source: string; // e.g. 'telegram', 'whatsapp', 'api', 'mission_engine', 'sentinel'
  timestamp: string;
}

export type GideonEventHandler<T = any> = (event: GideonEvent<T>) => void | Promise<void>;

export class GideonEventBus {
  private static instance: GideonEventBus;
  private handlers: Map<GideonEventType | '*', Set<GideonEventHandler>> = new Map();
  private history: GideonEvent[] = [];
  private maxHistorySize: number = 1000;

  constructor() {
    this.handlers.set('*', new Set());
  }

  public static getInstance(): GideonEventBus {
    if (!GideonEventBus.instance) {
      GideonEventBus.instance = new GideonEventBus();
    }
    return GideonEventBus.instance;
  }

  public subscribe<T = any>(
    eventType: GideonEventType | '*',
    handler: GideonEventHandler<T>
  ): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler as GideonEventHandler);

    return () => {
      const set = this.handlers.get(eventType);
      if (set) {
        set.delete(handler as GideonEventHandler);
      }
    };
  }

  public emit<T = any>(type: GideonEventType, payload: T, source: string = 'system'): GideonEvent<T> {
    const event: GideonEvent<T> = {
      id: `evt-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      type,
      payload,
      source,
      timestamp: new Date().toISOString()
    };

    // Store in history
    this.history.push(event);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // Trigger specific handlers
    const specificHandlers = this.handlers.get(type);
    if (specificHandlers) {
      for (const handler of specificHandlers) {
        try {
          handler(event);
        } catch (err) {
          console.error(`[EventBus] Handler error on ${type}:`, err);
        }
      }
    }

    // Trigger wildcard handlers
    const wildcardHandlers = this.handlers.get('*');
    if (wildcardHandlers) {
      for (const handler of wildcardHandlers) {
        try {
          handler(event);
        } catch (err) {
          console.error(`[EventBus] Wildcard handler error:`, err);
        }
      }
    }

    return event;
  }

  public getHistory(type?: GideonEventType, limit?: number): GideonEvent[] {
    let list = this.history;
    if (type) {
      list = list.filter((e) => e.type === type);
    }
    if (limit && limit > 0) {
      list = list.slice(-limit);
    }
    return [...list];
  }

  public clearHistory(): void {
    this.history = [];
  }
}
