-- =============================================================================
-- GIDEON AI HQ — COMBINED V5 & V5.2 MIGRATION SCRIPT
-- Execute this script once in your Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/tunfhlthcmznagmtawcx/sql/new
-- =============================================================================

-- 1. EXTEND hq_execution_jobs & hq_task_runs FOR OPENCLAW SESSIONS
ALTER TABLE IF EXISTS hq_execution_jobs 
    ADD COLUMN IF NOT EXISTS openclaw_session_key TEXT,
    ADD COLUMN IF NOT EXISTS correlation_id TEXT;

ALTER TABLE IF EXISTS hq_task_runs 
    ADD COLUMN IF NOT EXISTS openclaw_session_key TEXT,
    ADD COLUMN IF NOT EXISTS total_tokens INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cost_cents NUMERIC(12, 4) DEFAULT 0.0000;

CREATE INDEX IF NOT EXISTS idx_exec_jobs_openclaw_session 
    ON hq_execution_jobs(openclaw_session_key) 
    WHERE openclaw_session_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_task_runs_openclaw_session 
    ON hq_task_runs(openclaw_session_key) 
    WHERE openclaw_session_key IS NOT NULL;

-- 2. DUAL-CURRENCY CFO ENGINE LEDGER (hq_ledger_transactions)
CREATE TABLE IF NOT EXISTS hq_ledger_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_type TEXT NOT NULL, 
    currency TEXT NOT NULL DEFAULT 'USD',
    amount_cents NUMERIC(14, 2) NOT NULL,
    token_count INTEGER DEFAULT 0,
    unit_cost_cents NUMERIC(10, 6) DEFAULT 0.000000,
    agent_id TEXT REFERENCES hq_agents(id) ON DELETE SET NULL,
    task_id UUID REFERENCES hq_tasks(id) ON DELETE SET NULL,
    task_run_id UUID REFERENCES hq_task_runs(id) ON DELETE SET NULL,
    mission_id UUID,
    status TEXT NOT NULL DEFAULT 'COMMITTED',
    description TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_agent 
    ON hq_ledger_transactions(agent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ledger_task 
    ON hq_ledger_transactions(task_id);

CREATE INDEX IF NOT EXISTS idx_ledger_type 
    ON hq_ledger_transactions(transaction_type, created_at DESC);

-- 3. OPPORTUNITY RADAR (hq_opportunities)
CREATE TABLE IF NOT EXISTS hq_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    source TEXT NOT NULL, 
    source_url TEXT,
    estimated_value_cents NUMERIC(14, 2) DEFAULT 0.00,
    confidence_score NUMERIC(5, 4) DEFAULT 0.5000,
    status TEXT NOT NULL DEFAULT 'DISCOVERED',
    target_skills TEXT[] DEFAULT '{}',
    converted_task_id UUID REFERENCES hq_tasks(id) ON DELETE SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_opportunities_status 
    ON hq_opportunities(status, estimated_value_cents DESC);

CREATE INDEX IF NOT EXISTS idx_opportunities_source 
    ON hq_opportunities(source, discovered_at DESC);

-- 4. REVENUE EXPERIMENTS (hq_revenue_experiments)
CREATE TABLE IF NOT EXISTS hq_revenue_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    hypothesis TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PROPOSED',
    budget_limit_cents NUMERIC(14, 2) NOT NULL DEFAULT 5000.00,
    spend_cents NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    revenue_collected_cents NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    success_criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_experiments_status 
    ON hq_revenue_experiments(status, created_at DESC);

-- 5. AGENT DEFINITIONS & CONSTITUTIONS (hq_agent_definitions)
CREATE TABLE IF NOT EXISTS hq_agent_definitions (
    id TEXT PRIMARY KEY, 
    name TEXT NOT NULL,
    tier INTEGER NOT NULL DEFAULT 2,
    role TEXT NOT NULL,
    department TEXT NOT NULL,
    constitution JSONB NOT NULL DEFAULT '{}'::jsonb,
    model_name TEXT NOT NULL DEFAULT 'google/gemini-3.7-flash',
    fallback_models TEXT[] NOT NULL DEFAULT ARRAY['google/gemini-3.5-flash', 'google/gemini-2.5-flash'],
    thinking_level TEXT NOT NULL DEFAULT 'medium',
    allowed_tools TEXT[] NOT NULL DEFAULT '{}',
    denied_tools TEXT[] NOT NULL DEFAULT '{}',
    budget_limit_cents NUMERIC(14, 2) NOT NULL DEFAULT 1000.00,
    current_spend_cents NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_ephemeral BOOLEAN NOT NULL DEFAULT false,
    ttl_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. DURABLE CONVERSATIONS (hq_conversations)
CREATE TABLE IF NOT EXISTS hq_conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'New Gideon Session',
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    context_type TEXT NOT NULL DEFAULT 'GLOBAL',
    context_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_status_updated 
    ON hq_conversations(status, updated_at DESC);

-- 7. CONVERSATION MESSAGES & EXECUTION TRACES (hq_conversation_messages)
CREATE TABLE IF NOT EXISTS hq_conversation_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES hq_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user',
    agent_id TEXT,
    content TEXT NOT NULL,
    command_verb TEXT,
    mission_id TEXT,
    task_id UUID REFERENCES hq_tasks(id) ON DELETE SET NULL,
    opportunity_id UUID REFERENCES hq_opportunities(id) ON DELETE SET NULL,
    approval_id TEXT,
    execution_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conv_messages_convo 
    ON hq_conversation_messages(conversation_id, created_at ASC);

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE hq_ledger_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_revenue_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_agent_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_conversation_messages ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow all operations for service_role and public anon" ON hq_ledger_transactions;
    CREATE POLICY "Allow all operations for service_role and public anon" ON hq_ledger_transactions FOR ALL USING (true);
    
    DROP POLICY IF EXISTS "Allow all operations for service_role and public anon" ON hq_opportunities;
    CREATE POLICY "Allow all operations for service_role and public anon" ON hq_opportunities FOR ALL USING (true);
    
    DROP POLICY IF EXISTS "Allow all operations for service_role and public anon" ON hq_revenue_experiments;
    CREATE POLICY "Allow all operations for service_role and public anon" ON hq_revenue_experiments FOR ALL USING (true);
    
    DROP POLICY IF EXISTS "Allow all operations for service_role and public anon" ON hq_agent_definitions;
    CREATE POLICY "Allow all operations for service_role and public anon" ON hq_agent_definitions FOR ALL USING (true);
    
    DROP POLICY IF EXISTS "Allow all operations for service_role and public anon" ON hq_conversations;
    CREATE POLICY "Allow all operations for service_role and public anon" ON hq_conversations FOR ALL USING (true);
    
    DROP POLICY IF EXISTS "Allow all operations for service_role and public anon" ON hq_conversation_messages;
    CREATE POLICY "Allow all operations for service_role and public anon" ON hq_conversation_messages FOR ALL USING (true);
END $$;
