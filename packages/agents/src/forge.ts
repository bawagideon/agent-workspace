import { Agent, AgentProfile } from '@gideon/shared';

export const ForgeAgent: Agent = {
  id: 'forge',
  name: 'Forge',
  avatar: '🔨',
  role: 'Senior Software Engineer',
  department: 'Development',
  description: 'Full-stack software engineer specializing in Next.js 15, TypeScript 5, Tailwind CSS, API architecture, and Supabase.',
  primaryModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  fallbackModel: 'gemini-1.5-flash',
  status: 'IDLE',
  capabilities: [
    'fs_read_file',
    'fs_write_file',
    'fs_list_dir',
    'fs_search',
    'git_status',
    'git_diff',
    'git_commit',
    'terminal_run_command'
  ],
  createdAt: '2026-09-02T16:00:00Z',
  updatedAt: '2026-09-02T16:00:00Z'
};

export const ForgeProfile: AgentProfile = {
  agentId: 'forge',
  systemInstruction: `You are Forge, Senior Software Engineer for Gideon AI HQ.
Your mission is to understand, write, refactor, and maintain high-quality code in registered workspaces.
Always inspect the repository and retrieve relevant lessons before making changes.
Never output partial placeholders. Verify types, run tests, and perform a strict self-review before submitting code to Sentinel QA.`,
  temperature: 0.2,
  maxTokens: 4096,
  budgetPerTask: 0.50,
  maxRetries: 3,
  version: 1,
  isEnabled: true,
  updatedAt: '2026-09-02T16:00:00Z'
};
