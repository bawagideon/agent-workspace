-- =============================================================================
-- GIDEON AI HQ (THE BASEMENT) — V3 MASTER DATABASE SCHEMA
-- Version: 3.0.0
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. MACHINES & LOCAL RUNNER REGISTRY
-- =============================================================================
CREATE TABLE IF NOT EXISTS hq_machines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'win32', -- 'win32', 'linux', 'darwin'
    runner_version TEXT NOT NULL DEFAULT '3.0.0',
    status TEXT NOT NULL DEFAULT 'OFFLINE', -- 'ONLINE', 'BUSY', 'DEGRADED', 'OFFLINE'
    last_heartbeat_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    capabilities TEXT[] DEFAULT '{}',
    active_task_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 2. WORKSPACES & SANDBOX BOUNDARIES
-- =============================================================================
CREATE TABLE IF NOT EXISTS hq_workspaces (
    id TEXT PRIMARY KEY,
    machine_id TEXT REFERENCES hq_machines(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    root_path TEXT NOT NULL,
    access_mode TEXT NOT NULL DEFAULT 'READ_WRITE', -- 'READ_ONLY', 'READ_WRITE', 'DISABLED'
    status TEXT NOT NULL DEFAULT 'READY', -- 'READY', 'DIRTY', 'NEEDS_ATTENTION', 'UNREACHABLE'
    git_enabled BOOLEAN DEFAULT true,
    default_branch TEXT DEFAULT 'main',
    allowed_agents TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hq_workspace_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id TEXT REFERENCES hq_workspaces(id) ON DELETE CASCADE,
    allow_reads BOOLEAN DEFAULT true,
    allow_writes BOOLEAN DEFAULT true,
    allow_terminal BOOLEAN DEFAULT true,
    allow_git BOOLEAN DEFAULT true,
    allow_network BOOLEAN DEFAULT false,
    default_approval_mode TEXT DEFAULT 'PLAN', -- 'AUTO', 'PLAN', 'SESSION', 'ALWAYS_ASK'
    allowed_commands TEXT[] DEFAULT ARRAY['npm test', 'npm run build', 'npm run lint', 'npm run typecheck', 'git status', 'git diff', 'git log'],
    blocked_commands TEXT[] DEFAULT ARRAY['rm -rf', 'format', 'dd'],
    blocked_patterns TEXT[] DEFAULT ARRAY['.env*', '.git/config', '*.pem', '*.key', 'id_rsa*'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 3. AGENTS (DIGITAL EMPLOYEES)
-- =============================================================================
CREATE TABLE IF NOT EXISTS hq_agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar TEXT,
    role TEXT NOT NULL,
    department TEXT NOT NULL, -- 'Development', 'QA', 'Management', 'Career', 'Media'
    description TEXT,
    primary_model TEXT NOT NULL DEFAULT 'gemini-2.0-flash',
    fallback_model TEXT DEFAULT 'gemini-1.5-flash',
    status TEXT NOT NULL DEFAULT 'IDLE', -- 'IDLE', 'PLANNING', 'WORKING', 'WAITING_APPROVAL', 'PAUSED'
    capabilities TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hq_agent_profiles (
    agent_id TEXT PRIMARY KEY REFERENCES hq_agents(id) ON DELETE CASCADE,
    system_instruction TEXT NOT NULL,
    temperature NUMERIC DEFAULT 0.2,
    max_tokens INTEGER DEFAULT 4096,
    budget_per_task NUMERIC DEFAULT 0.50,
    max_retries INTEGER DEFAULT 3,
    version INTEGER DEFAULT 1,
    is_enabled BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 4. TASKS, RUNS & EXECUTION PLANS
-- =============================================================================
CREATE TABLE IF NOT EXISTS hq_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id TEXT REFERENCES hq_workspaces(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    goal TEXT NOT NULL,
    assigned_agent_id TEXT REFERENCES hq_agents(id) ON DELETE SET NULL,
    department TEXT NOT NULL DEFAULT 'Development',
    priority TEXT NOT NULL DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    autonomy_mode TEXT NOT NULL DEFAULT 'PLAN_APPROVAL', -- 'AUTO', 'PLAN_APPROVAL', 'SESSION', 'ALWAYS_ASK'
    status TEXT NOT NULL DEFAULT 'CREATED', 
    -- 'CREATED', 'QUEUED', 'RUNNER_ASSIGNED', 'CONTEXT_LOADING', 'INSPECTING', 'PLANNING', 
    -- 'WAITING_APPROVAL', 'EXECUTING', 'OBSERVING', 'SELF_REVIEW', 'QA_PENDING', 'QA_EXECUTING', 
    -- 'COMPLETED', 'FAILED', 'BLOCKED', 'BLOCKED_OFFLINE', 'EMERGENCY_STOPPED'
    parent_task_id UUID REFERENCES hq_tasks(id) ON DELETE CASCADE,
    result_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hq_task_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES hq_tasks(id) ON DELETE CASCADE,
    runner_id TEXT REFERENCES hq_machines(id) ON DELETE SET NULL,
    run_number INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'RUNNING',
    total_tokens INTEGER DEFAULT 0,
    total_cost NUMERIC DEFAULT 0.0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS hq_execution_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_run_id UUID NOT NULL REFERENCES hq_task_runs(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'PROPOSED', -- 'PROPOSED', 'APPROVED', 'REJECTED', 'EXECUTING', 'COMPLETED'
    risk_summary TEXT,
    plan_json JSONB NOT NULL,
    plan_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hq_plan_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES hq_execution_plans(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    description TEXT NOT NULL,
    tool_id TEXT NOT NULL,
    input_params JSONB NOT NULL DEFAULT '{}'::jsonb,
    risk_level TEXT NOT NULL DEFAULT 'LOW', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    expected_outcome TEXT,
    verification_method TEXT,
    rollback_strategy TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hq_tool_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_run_id UUID NOT NULL REFERENCES hq_task_runs(id) ON DELETE CASCADE,
    plan_step_id UUID REFERENCES hq_plan_steps(id) ON DELETE SET NULL,
    tool_id TEXT NOT NULL,
    input_params JSONB NOT NULL,
    output_result JSONB,
    status TEXT NOT NULL DEFAULT 'SUCCESS', -- 'SUCCESS', 'FAILED', 'KILLED'
    duration_ms INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- 5. APPROVAL ENGINE & ARTIFACTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS hq_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES hq_tasks(id) ON DELETE CASCADE,
    task_run_id UUID REFERENCES hq_task_runs(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES hq_execution_plans(id) ON DELETE CASCADE,
    plan_step_id UUID REFERENCES hq_plan_steps(id) ON DELETE SET NULL,
    agent_id TEXT REFERENCES hq_agents(id) ON DELETE SET NULL,
    workspace_id TEXT REFERENCES hq_workspaces(id) ON DELETE SET NULL,
    risk_level TEXT NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    approval_mode TEXT NOT NULL, -- 'AUTO', 'PLAN', 'SESSION', 'ALWAYS_ASK'
    action_type TEXT NOT NULL, -- 'FILE_WRITE', 'GIT_COMMIT', 'GIT_PUSH', 'RUN_COMMAND', 'DEPLOY'
    description TEXT NOT NULL,
    diff_preview TEXT,
    command_preview TEXT,
    authorization_hash TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'
    expires_at TIMESTAMP WITH TIME ZONE,
    reviewer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS hq_task_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES hq_tasks(id) ON DELETE CASCADE,
    task_run_id UUID REFERENCES hq_task_runs(id) ON DELETE CASCADE,
    artifact_type TEXT NOT NULL, -- 'DIFF', 'TEST_RESULT', 'BUILD_LOG', 'SELF_REVIEW', 'QA_REPORT', 'SUMMARY'
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 6. MEMORY VAULT, PLAYBOOKS & SKILLS
-- =============================================================================
CREATE TABLE IF NOT EXISTS hq_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL, -- 'USER', 'PROJECT', 'AGENT', 'LESSON'
    workspace_id TEXT REFERENCES hq_workspaces(id) ON DELETE SET NULL,
    agent_id TEXT REFERENCES hq_agents(id) ON DELETE SET NULL,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    confidence NUMERIC DEFAULT 1.0,
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'PROPOSED', 'ACTIVE', 'DISABLED', 'ARCHIVED'
    source_type TEXT NOT NULL DEFAULT 'USER_EXPLICIT', -- 'USER_EXPLICIT', 'TASK_LESSON', 'SENTINEL_QA'
    source_reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hq_skills (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    instructions TEXT NOT NULL,
    verification_rules JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hq_playbooks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'DETERMINISTIC', -- 'DETERMINISTIC', 'ADAPTIVE'
    description TEXT,
    trigger TEXT,
    steps JSONB NOT NULL,
    version INTEGER DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 7. EVENT LOGGING & REALTIME AUDIT STREAM
-- =============================================================================
CREATE TABLE IF NOT EXISTS hq_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES hq_tasks(id) ON DELETE CASCADE,
    task_run_id UUID REFERENCES hq_task_runs(id) ON DELETE CASCADE,
    agent_id TEXT REFERENCES hq_agents(id) ON DELETE SET NULL,
    machine_id TEXT REFERENCES hq_machines(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'INFO', -- 'INFO', 'WARN', 'ERROR', 'CRITICAL'
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- 8. INDEXES FOR PERFORMANCE
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_tasks_status ON hq_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_agent ON hq_tasks(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON hq_approvals(status);
CREATE INDEX IF NOT EXISTS idx_events_task_id ON hq_events(task_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON hq_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memories_workspace ON hq_memories(workspace_id);
