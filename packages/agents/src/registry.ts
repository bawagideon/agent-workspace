import { Agent, AgentProfile } from '@gideon/shared';
import { ForgeAgent, ForgeProfile } from './forge';
import { SentinelAgent, SentinelProfile } from './sentinel';
import { AtlasAgent, AtlasProfile } from './atlas';

export class AgentRegistry {
  private static agents: Map<string, { agent: Agent; profile: AgentProfile }> = new Map();

  static {
    this.register(ForgeAgent, ForgeProfile);
    this.register(SentinelAgent, SentinelProfile);
    this.register(AtlasAgent, AtlasProfile);
  }

  public static register(agent: Agent, profile: AgentProfile): void {
    this.agents.set(agent.id, { agent, profile });
  }

  public static get(agentId: string): { agent: Agent; profile: AgentProfile } | undefined {
    return this.agents.get(agentId);
  }

  public static getAllAgents(): Agent[] {
    return Array.from(this.agents.values()).map((e) => e.agent);
  }
}

export * from './forge';
export * from './sentinel';
export * from './atlas';
