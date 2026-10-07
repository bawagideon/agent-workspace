import { Agent, AgentProfile, AgentConstitution, AgentTier } from '@gideon/shared';
import { AgentRegistry } from './registry';

export interface CreateAgentOptions {
  id: string;
  name: string;
  tier: AgentTier;
  role: string;
  department: string;
  mission: string;
  principles: string[];
  modelName?: string;
  fallbackModels?: string[];
  thinkingLevel?: 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'adaptive';
  allowedTools: string[];
  deniedTools?: string[];
  budgetLimitCents?: number;
  subagentPolicy?: {
    canSpawn: boolean;
    maxChildren: number;
    allowedChildAgentIds?: string[];
  };
  ephemeralConfig?: {
    ttlSeconds: number;
    destroyOnComplete: boolean;
  };
}

export class AgentFactory {
  private static constitutions: Map<string, AgentConstitution> = new Map();

  /**
   * Instantiates and registers a permanent or specialist agent constitution.
   */
  public static createAgent(options: CreateAgentOptions): AgentConstitution {
    // 1. Tier-based validation
    if (options.tier === 1) {
      // Tier-1: Executive / Staff
      options.subagentPolicy = options.subagentPolicy || { canSpawn: true, maxChildren: 5 };
      options.budgetLimitCents = options.budgetLimitCents || 5000.00; // $50 max default
    } else if (options.tier === 2) {
      // Tier-2: Specialists
      options.subagentPolicy = options.subagentPolicy || { canSpawn: false, maxChildren: 0 };
      options.budgetLimitCents = options.budgetLimitCents || 1500.00; // $15 max default
    } else if (options.tier === 3) {
      // Tier-3: Ephemeral worker
      options.subagentPolicy = { canSpawn: false, maxChildren: 0 };
      options.budgetLimitCents = Math.min(options.budgetLimitCents || 100.00, 200.00); // Cap at $2.00
      options.ephemeralConfig = options.ephemeralConfig || { ttlSeconds: 1800, destroyOnComplete: true };
    }

    // 2. Denied tool enforcement
    const effectiveAllowedTools = options.allowedTools.filter(
      (tool) => !(options.deniedTools || []).includes(tool)
    );

    const constitution: AgentConstitution = {
      id: options.id,
      name: options.name,
      tier: options.tier,
      role: options.role,
      department: options.department,
      mission: options.mission,
      principles: options.principles,
      modelName: options.modelName || process.env.GEMINI_MODEL || 'google/gemini-3.7-flash',
      fallbackModels: options.fallbackModels || ['google/gemini-3.5-flash', 'google/gemini-2.5-flash'],
      thinkingLevel: options.thinkingLevel || 'medium',
      allowedTools: effectiveAllowedTools,
      deniedTools: options.deniedTools || [],
      budgetLimitCents: options.budgetLimitCents || 1000.00,
      currentSpendCents: 0,
      subagentPolicy: options.subagentPolicy,
      ephemeralConfig: options.ephemeralConfig
    };

    // 3. Register in in-memory map
    this.constitutions.set(constitution.id, constitution);

    // 4. Register in AgentRegistry
    const agent: Agent = {
      id: constitution.id,
      name: constitution.name,
      avatar: options.tier === 1 ? '👑' : options.tier === 2 ? '⚡' : '⚙️',
      role: constitution.role,
      department: constitution.department as any,
      description: constitution.mission,
      primaryModel: constitution.modelName,
      fallbackModel: constitution.fallbackModels[0],
      status: 'IDLE',
      capabilities: constitution.allowedTools,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const profile: AgentProfile = {
      agentId: constitution.id,
      systemInstruction: `You are ${constitution.name}, ${constitution.role} (${constitution.department}).\nMission: ${constitution.mission}\nPrinciples:\n${constitution.principles.map((p) => `- ${p}`).join('\n')}`,
      temperature: 0.2,
      maxTokens: 4096,
      budgetPerTask: constitution.budgetLimitCents / 100,
      maxRetries: 3,
      version: 1,
      isEnabled: true,
      updatedAt: new Date().toISOString()
    };

    AgentRegistry.register(agent, profile);

    return constitution;
  }

  /**
   * Spawns an isolated Tier-3 ephemeral worker bound to a single task execution.
   */
  public static createEphemeralWorker(
    parentAgentId: string,
    taskGoal: string,
    allowedTools: string[],
    budgetCapCents: number = 100.00
  ): AgentConstitution {
    const workerId = `worker-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    return this.createAgent({
      id: workerId,
      name: `Worker (${workerId})`,
      tier: 3,
      role: 'Ephemeral Task Specialist',
      department: 'Execution',
      mission: `Execute discrete subtask: "${taskGoal}" under supervision of ${parentAgentId}.`,
      principles: [
        'Execute only the assigned subtask without modifying out-of-scope files.',
        'Strictly respect the task budget limit.',
        'Terminate immediately upon completion.'
      ],
      allowedTools,
      budgetLimitCents: budgetCapCents,
      ephemeralConfig: {
        ttlSeconds: 1800, // 30 minutes max lifetime
        destroyOnComplete: true
      }
    });
  }

  public static getConstitution(agentId: string): AgentConstitution | undefined {
    return this.constitutions.get(agentId);
  }

  public static getAllConstitutions(): AgentConstitution[] {
    return Array.from(this.constitutions.values());
  }
}
