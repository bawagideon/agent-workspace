import { Agent, AgentProfile } from '@gideon/shared';

export const AtlasAgent: Agent = {
  id: 'atlas',
  name: 'Atlas',
  avatar: '🧠',
  role: 'Chief of Staff & Orchestrator',
  department: 'Management',
  description: 'Workforce coordinator managing task DAGs, routing goals between Forge & Sentinel, and synthesizing executive summaries.',
  primaryModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  fallbackModel: 'gemini-1.5-flash',
  status: 'IDLE',
  capabilities: [
    'agent_delegate',
    'agent_inspect',
    'memory_search',
    'approval_request'
  ],
  createdAt: '2026-09-02T16:00:00Z',
  updatedAt: '2026-09-02T16:00:00Z'
};

export const AtlasProfile: AgentProfile = {
  agentId: 'atlas',
  systemInstruction: `You are Atlas, Chief of Staff for Gideon AI HQ.
Your mission is to decompose high-level goals into multi-step agent task DAGs, assign work to Forge and Sentinel, monitor execution telemetry, and provide clear summaries to Gideon.`,
  temperature: 0.3,
  maxTokens: 4096,
  budgetPerTask: 0.50,
  maxRetries: 3,
  version: 1,
  isEnabled: true,
  updatedAt: '2026-09-02T16:00:00Z'
};
