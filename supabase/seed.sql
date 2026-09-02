-- =============================================================================
-- GIDEON AI HQ (THE BASEMENT) — SEED DATA
-- =============================================================================

-- 1. Initial Machine
INSERT INTO hq_machines (id, name, platform, runner_version, status, capabilities)
VALUES (
    'GIDMACHINE_WIN',
    'Gideon Main Workstation (Windows)',
    'win32',
    '3.0.0',
    'ONLINE',
    ARRAY['node', 'git', 'npm', 'pnpm', 'tsc', 'python', 'powershell']
) ON CONFLICT (id) DO UPDATE SET status = 'ONLINE', last_heartbeat_at = NOW();

-- 2. Initial Workspaces
INSERT INTO hq_workspaces (id, machine_id, name, root_path, access_mode, status, git_enabled, default_branch, allowed_agents)
VALUES (
    'ws-agent-workspace',
    'GIDMACHINE_WIN',
    'Gideon AI HQ Core Workspace',
    'C:\\Users\\DELL\\agent-workspace',
    'READ_WRITE',
    'READY',
    true,
    'main',
    ARRAY['forge', 'sentinel', 'atlas']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO hq_workspace_policies (workspace_id, allow_reads, allow_writes, allow_terminal, allow_git, allow_network, default_approval_mode)
VALUES (
    'ws-agent-workspace',
    true,
    true,
    true,
    true,
    false,
    'PLAN'
) ON CONFLICT DO NOTHING;

-- 3. Digital Employees
INSERT INTO hq_agents (id, name, avatar, role, department, description, primary_model, status, capabilities)
VALUES 
(
    'forge',
    'Forge',
    '🔨',
    'Senior Software Engineer',
    'Development',
    'Full-stack engineer specializing in Next.js 15, TypeScript, Tailwind CSS, API architecture, and Supabase.',
    'gemini-2.0-flash',
    'IDLE',
    ARRAY['fs_read', 'fs_write', 'fs_list', 'fs_search', 'git_status', 'git_diff', 'git_branch', 'git_commit', 'terminal_run_test', 'terminal_run_build']
),
(
    'sentinel',
    'Sentinel',
    '🛡️',
    'QA & Reliability Engineer',
    'QA',
    'Staff QA engineer performing independent code reviews, boundary tests, regression detection, and build verification.',
    'gemini-2.0-flash',
    'IDLE',
    ARRAY['fs_read', 'fs_list', 'fs_search', 'git_diff', 'terminal_run_test', 'terminal_run_lint', 'terminal_run_typecheck']
),
(
    'atlas',
    'Atlas',
    '🧠',
    'Chief of Staff & Orchestrator',
    'Management',
    'Workforce coordinator managing task DAGs, routing goals between Forge & Sentinel, and synthesizing executive summaries.',
    'gemini-2.0-flash',
    'IDLE',
    ARRAY['agent_delegate', 'agent_inspect', 'memory_search', 'approval_request']
)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    capabilities = EXCLUDED.capabilities;

-- Agent Profiles
INSERT INTO hq_agent_profiles (agent_id, system_instruction, temperature, max_tokens, budget_per_task)
VALUES
(
    'forge',
    'You are Forge, Senior Software Engineer for Gideon AI HQ.
Your mission is to understand, write, refactor, and maintain high-quality code in registered workspaces.
Always inspect the repository and retrieve relevant lessons before making changes.
Never output partial placeholders. Verify types, run tests, and perform a strict self-review before submitting code to Sentinel QA.',
    0.2,
    4096,
    0.50
),
(
    'sentinel',
    'You are Sentinel, Staff QA Engineer for Gideon AI HQ.
Your mission is to independently inspect diffs, test changes, check edge cases, and verify builds produced by Forge.
Never trust a summary without verifying the actual diff. Issue structured bug reports with exact line numbers when issues are found.',
    0.1,
    4096,
    0.30
),
(
    'atlas',
    'You are Atlas, Chief of Staff for Gideon AI HQ.
Your mission is to decompose high-level goals into multi-step agent task DAGs, assign work to Forge and Sentinel, monitor execution telemetry, and provide clear summaries to Gideon.',
    0.3,
    4096,
    0.50
)
ON CONFLICT (agent_id) DO NOTHING;

-- 4. Initial Playbooks
INSERT INTO hq_playbooks (id, name, category, type, description, trigger, steps)
VALUES (
    'playbook-safe-coding',
    'Safe Coding & Verification Routine',
    'Development',
    'DETERMINISTIC',
    'Standard 7-step engineering routine followed by Forge for every code modification.',
    'User submits feature or bugfix task',
    '[
        {"step": 1, "action": "Inspect workspace and read affected files", "tool": "fs_read_file"},
        {"step": 2, "action": "Formulate atomic plan with diff strategy", "tool": "planner"},
        {"step": 3, "action": "Request Plan Approval if modifying code", "tool": "approval_engine"},
        {"step": 4, "action": "Apply verified modifications inside sandbox", "tool": "fs_write_file"},
        {"step": 5, "action": "Run typecheck and unit tests", "tool": "terminal_run_command"},
        {"step": 6, "action": "Compute automated self-review scorecard", "tool": "self_reviewer"},
        {"step": 7, "action": "Hand off to Sentinel QA for independent audit", "tool": "qa_handoff"}
    ]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- 5. Initial Memory
INSERT INTO hq_memories (category, key, value, confidence, source_type, source_reference)
VALUES 
(
    'USER',
    'developer_stack_preferences',
    '{"framework": "Next.js 15 (App Router)", "language": "TypeScript 5", "styling": "Tailwind CSS", "database": "Supabase PostgreSQL", "deployment": "Vercel"}'::jsonb,
    1.0,
    'USER_EXPLICIT',
    'Initial Configuration'
),
(
    'PROJECT',
    'safety_policy_baseline',
    '{"no_env_leaks": true, "plan_approval_required_for_writes": true, "git_push_always_gated": true}'::jsonb,
    1.0,
    'USER_EXPLICIT',
    'Security Mandate'
)
ON CONFLICT DO NOTHING;
