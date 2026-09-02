import { MemoryEngine } from '@gideon/memory';
import { AgentRegistry } from '@gideon/agents';
import { MemoryRecord, Agent } from '@gideon/shared';

export interface TaskContextSnapshot {
  agent: Agent;
  systemInstruction: string;
  workspaceId: string;
  relevantMemories: MemoryRecord[];
  timestamp: string;
}

export class ContextBuilder {
  constructor(private memoryEngine: MemoryEngine) {}

  public async buildContext(agentId: string, workspaceId: string): Promise<TaskContextSnapshot> {
    const entry = AgentRegistry.get(agentId);
    if (!entry) {
      throw new Error(`Agent not found in registry: ${agentId}`);
    }

    const memories = await this.memoryEngine.retrieveContext({
      workspaceId,
      agentId,
      limit: 10
    });

    return {
      agent: entry.agent,
      systemInstruction: entry.profile.systemInstruction,
      workspaceId,
      relevantMemories: memories,
      timestamp: new Date().toISOString()
    };
  }
}
