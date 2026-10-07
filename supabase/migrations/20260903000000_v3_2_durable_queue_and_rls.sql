-- =============================================================================
-- GIDEON AI HQ — V3.2 DURABLE EXECUTION QUEUE & ROW LEVEL SECURITY (RLS)
-- Version: 3.2.0
-- =============================================================================

-- =============================================================================
-- 1. DURABLE EXECUTION QUEUE TABLE (hq_execution_jobs)
-- =============================================================================
CREATE TABLE IF NOT EXISTS hq_execution_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES hq_tasks(id) ON DELETE CASCADE,
    task_run_id UUID REFERENCES hq_task_runs(id) ON DELETE CASCADE,
    step_id UUID REFERENCES hq_plan_steps(id) ON DELETE SET NULL,
    machine_id TEXT REFERENCES hq_machines(id) ON DELETE SET NULL,
    workspace_id TEXT REFERENCES hq_workspaces(id) ON DELETE CASCADE,
    tool_id TEXT NOT NULL,
    input_params JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'QUEUED', 
    -- 'QUEUED', 'CLAIMED', 'RUNNING', 'WAITING_APPROVAL', 'COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED'
    priority INTEGER NOT NULL DEFAULT 10,
    idempotency_key TEXT UNIQUE,
    authorization_hash TEXT,
    execution_contract JSONB,
    claimed_by TEXT REFERENCES hq_machines(id) ON DELETE SET NULL,
    lease_expires_at TIMESTAMP WITH TIME ZONE,
    heartbeat_at TIMESTAMP WITH TIME ZONE,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    output_result JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Optimized partial indexes for atomic queue polling & lease recovery
CREATE INDEX IF NOT EXISTS idx_exec_jobs_pending 
    ON hq_execution_jobs(status, priority DESC, created_at ASC) 
    WHERE status = 'QUEUED';

CREATE INDEX IF NOT EXISTS idx_exec_jobs_lease 
    ON hq_execution_jobs(lease_expires_at) 
    WHERE status IN ('CLAIMED', 'RUNNING');

CREATE INDEX IF NOT EXISTS idx_exec_jobs_task 
    ON hq_execution_jobs(task_id, status);

-- =============================================================================
-- 2. ATOMIC JOB CLAIMING RPC FUNCTION (FOR UPDATE SKIP LOCKED)
-- =============================================================================
CREATE OR REPLACE FUNCTION claim_next_execution_job(
    p_machine_id TEXT,
    p_lease_duration_seconds INTEGER DEFAULT 300
)
RETURNS SETOF hq_execution_jobs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_job hq_execution_jobs;
BEGIN
    RETURN QUERY
    WITH next_job AS (
        SELECT id
        FROM hq_execution_jobs
        WHERE (machine_id IS NULL OR machine_id = p_machine_id)
          AND (
            status = 'QUEUED' 
            OR (status IN ('CLAIMED', 'RUNNING') AND lease_expires_at < NOW())
          )
          AND attempt_count < max_attempts
        ORDER BY priority DESC, created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
    )
    UPDATE hq_execution_jobs
    SET 
        status = 'CLAIMED',
        claimed_by = p_machine_id,
        lease_expires_at = NOW() + (p_lease_duration_seconds || ' seconds')::interval,
        heartbeat_at = NOW(),
        attempt_count = attempt_count + 1,
        started_at = COALESCE(started_at, NOW())
    FROM next_job
    WHERE hq_execution_jobs.id = next_job.id
    RETURNING hq_execution_jobs.*;
END;
$$;

-- =============================================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS) ON ALL CORE TABLES
-- =============================================================================
ALTER TABLE hq_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_workspace_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_agent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_task_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_execution_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_plan_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_tool_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_task_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_execution_jobs ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 4. DEFAULT RLS POLICIES (Service Role has Full Access; Anon has Read-Only)
-- =============================================================================
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name LIKE 'hq_%'
    LOOP
        -- Policy for service_role (Full Access)
        EXECUTE format('DROP POLICY IF EXISTS service_role_all ON %I;', t);
        EXECUTE format('CREATE POLICY service_role_all ON %I FOR ALL TO service_role USING (true) WITH CHECK (true);', t);

        -- Policy for authenticated/anon users (Read-Only)
        EXECUTE format('DROP POLICY IF EXISTS public_read ON %I;', t);
        EXECUTE format('CREATE POLICY public_read ON %I FOR SELECT TO anon, authenticated USING (true);', t);
    END LOOP;
END;
$$;
