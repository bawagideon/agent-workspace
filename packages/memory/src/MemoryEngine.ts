import { MemoryRecord, MemoryCategory } from '@gideon/shared';
import { SupabaseClient } from '@supabase/supabase-js';

export interface MemoryQueryOptions {
  category?: MemoryCategory;
  workspaceId?: string;
  agentId?: string;
  limit?: number;
}

export class MemoryEngine {
  private localStore: MemoryRecord[] = [];

  constructor(private supabase?: SupabaseClient) {}

  public async retrieveContext(options: MemoryQueryOptions): Promise<MemoryRecord[]> {
    if (this.supabase) {
      let query = this.supabase.from('hq_memories').select('*').eq('status', 'ACTIVE');

      if (options.category) query = query.eq('category', options.category);
      if (options.workspaceId) query = query.or(`workspace_id.eq.${options.workspaceId},workspace_id.is.null`);
      if (options.agentId) query = query.or(`agent_id.eq.${options.agentId},agent_id.is.null`);
      if (options.limit) query = query.limit(options.limit);

      const { data, error } = await query;
      if (!error && data) {
        return data as MemoryRecord[];
      }
    }

    // Local in-memory fallback
    return this.localStore.filter((m) => {
      if (m.status !== 'ACTIVE') return false;
      if (options.category && m.category !== options.category) return false;
      if (options.workspaceId && m.workspaceId && m.workspaceId !== options.workspaceId) return false;
      if (options.agentId && m.agentId && m.agentId !== options.agentId) return false;
      return true;
    });
  }

  public async storeMemory(record: Omit<MemoryRecord, 'id' | 'createdAt' | 'lastConfirmedAt'>): Promise<MemoryRecord> {
    const memory: MemoryRecord = {
      ...record,
      id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString(),
      lastConfirmedAt: new Date().toISOString()
    };

    if (this.supabase) {
      await this.supabase.from('hq_memories').insert({
        id: memory.id,
        category: memory.category,
        workspace_id: memory.workspaceId,
        agent_id: memory.agentId,
        key: memory.key,
        value: memory.value,
        confidence: memory.confidence,
        status: memory.status,
        source_type: memory.sourceType,
        source_reference: memory.sourceReference,
        created_at: memory.createdAt,
        last_confirmed_at: memory.lastConfirmedAt
      });
    }

    this.localStore.push(memory);
    return memory;
  }
}
