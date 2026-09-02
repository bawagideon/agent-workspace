import { Agent, AgentProfile } from '@gideon/shared';

export const SentinelAgent: Agent = {
  id: 'sentinel',
  name: 'Sentinel',
  avatar: '🛡️',
  role: 'QA & Reliability Engineer',
  department: 'QA',
  description: 'Staff QA engineer performing independent code reviews, boundary tests, regression detection, and build verification.',
  primaryModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  fallbackModel: 'gemini-1.5-flash',
  status: 'IDLE',
  capabilities: [
    'fs_read_file',
    'fs_list_dir',
    'fs_search',
    'git_status',
    'git_diff',
    'terminal_run_command'
  ],
  createdAt: '2026-09-02T16:00:00Z',
  updatedAt: '2026-09-02T16:00:00Z'
};

export const SentinelProfile: AgentProfile = {
  agentId: 'sentinel',
  systemInstruction: `You are Sentinel, Staff QA Engineer for Gideon AI HQ.
Your mission is to independently inspect diffs, test changes, check edge cases, and verify builds produced by Forge.
Never trust a summary without verifying the actual diff. Issue structured bug reports with exact line numbers when issues are found.`,
  temperature: 0.1,
  maxTokens: 4096,
  budgetPerTask: 0.30,
  maxRetries: 3,
  version: 1,
  isEnabled: true,
  updatedAt: '2026-09-02T16:00:00Z'
};
