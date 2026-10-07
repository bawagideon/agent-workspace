-- =============================================================================
-- GIDEON AI HQ — V5.0 OPENCLAW INTEGRATION & AGENT ECONOMY
-- Version: 5.0.0
-- =============================================================================

-- =============================================================================
-- 1. EXTEND hq_execution_jobs & hq_task_runs FOR OPENCLAW SESSIONS
-- =============================================================================
ALTER TABLE IF EXISTS hq_execution_jobs 
    ADD COLUMN IF NOT EXISTS openclaw_session_key TEXT,
    ADD COLUMN IF NOT EXISTS correlation_id TEXT;

ALTER TABLE IF EXISTS hq_task_runs 
    ADD COLUMN IF NOT EXISTS openclaw_session_key TEXT,
    ADD COLUMN IF NOT EXISTS total_tokens INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cost_cents NUMERIC(12, 4) DEFAULT 0.0000;

-- Indexes for fast session tracking & correlations
CREATE INDEX IF NOT EXISTS idx_exec_jobs_openclaw_session 
    ON hq_execution_jobs(openclaw_session_key) 
    WHERE openclaw_session_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_task_runs_openclaw_session 
    ON hq_task_runs(openclaw_session_key) 
    WHERE openclaw_session_key IS NOT NULL;

-- =============================================================================
-- 2. DUAL-CURRENCY CFO ENGINE LEDGER (hq_ledger_transactions)
-- =============================================================================
CREATE TABLE IF NOT EXISTS hq_ledger_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_type TEXT NOT NULL, 
    -- 'REVENUE', 'EXPENSE', 'TOKEN_COST', 'ROYALTY', 'BOUNTY', 'PROVISIONING'
    currency TEXT NOT NULL DEFAULT 'USD',
    -- 'USD', 'EUR', 'GBP', 'TOKEN', 'CREDIT'
    amount_cents NUMERIC(14, 2) NOT NULL,
    token_count INTEGER DEFAULT 0,
    unit_cost_cents NUMERIC(10, 6) DEFAULT 0.000000,
    agent_id TEXT REFERENCES hq_agents(id) ON DELETE SET NULL,
    task_id UUID REFERENCES hq_tasks(id) ON DELETE SET NULL,
    task_run_id UUID REFERENCES hq_task_runs(id) ON DELETE SET NULL,
    mission_id UUID,
    status TEXT NOT NULL DEFAULT 'COMMITTED',
    -- 'PENDING', 'COMMITTED', 'DISPUTED', 'VOIDED'
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

-- =============================================================================
-- 3. OPPORTUNITY RADAR (hq_opportunities)
-- =============================================================================
CREATE TABLE IF NOT EXISTS hq_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    source TEXT NOT NULL, 
    -- 'UPWORK', 'GITHUB_BOUNTY', 'MARKET_SCAN', 'DIRECT_LEAD', 'INTERNAL'
    source_url TEXT,
    estimated_value_cents NUMERIC(14, 2) DEFAULT 0.00,
    confidence_score NUMERIC(5, 4) DEFAULT 0.5000,
    status TEXT NOT NULL DEFAULT 'DISCOVERED',
    -- 'DISCOVERED', 'ANALYZING', 'APPROVED', 'CONVERTED_TO_MISSION', 'REJECTED', 'EXPIRED'
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

-- =============================================================================
-- 4. REVENUE EXPERIMENTS (hq_revenue_experiments)
-- =============================================================================
CREATE TABLE IF NOT EXISTS hq_revenue_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    hypothesis TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PROPOSED',
    -- 'PROPOSED', 'APPROVED', 'RUNNING', 'VALIDATED', 'FAILED', 'SCALED', 'TERMINATED'
    budget_limit_cents NUMERIC(14, 2) NOT NULL DEFAULT 5000.00, -- Default $50 cap
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

-- =============================================================================
-- 5. AGENT DEFINITIONS & CONSTITUTIONS (hq_agent_definitions)
-- =============================================================================
CREATE TABLE IF NOT EXISTS hq_agent_definitions (
    id TEXT PRIMARY KEY, 
    -- e.g. 'atlas', 'ledger', 'forge', 'sentinel', 'release', 'scout'
    name TEXT NOT NULL,
    tier INTEGER NOT NULL DEFAULT 2, -- 1 = Executive/Staff, 2 = Specialists, 3 = Ephemeral
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

-- =============================================================================
-- 6. SEED CORE WORKFORCE PERSONAS & CONSTITUTIONS
-- =============================================================================
INSERT INTO hq_agent_definitions (
    id, name, tier, role, department, model_name, thinking_level, allowed_tools, denied_tools, budget_limit_cents, constitution
) VALUES 
(
    'atlas',
    'Atlas',
    1,
    'Chief of Staff & Workforce Orchestrator',
    'Operations',
    'google/gemini-3.7-flash',
    'high',
    ARRAY['openclaw_agent_dispatch', 'openclaw_tool_invoke', 'fs_list_dir', 'fs_read_file', 'fs_search'],
    ARRAY['fs_write_file', 'git_commit', 'terminal_run_command'],
    2500.00,
    '{
        "mission": "Orchestrate workforce, decompose missions, manage agent dependencies, and report status to Human Supreme.",
        "principles": [
            "Never execute destructive actions directly; delegate to specialized agents.",
            "Always enforce budget limits and request approval for financial outlays.",
            "Decompose complex goals into verifiable DAG steps."
        ],
        "subagent_policy": { "can_spawn": true, "max_children": 5 }
    }'::jsonb
),
(
    'ledger',
    'Ledger',
    1,
    'Chief Financial Officer & Resource Governor',
    'Finance',
    'google/gemini-3.7-flash',
    'medium',
    ARRAY['openclaw_tool_invoke', 'fs_read_file'],
    ARRAY['fs_write_file', 'terminal_run_command'],
    5000.00,
    '{
        "mission": "Track all revenue, token expenditure, cloud costs, and enforce strict financial governance.",
        "principles": [
            "Every mission must have an economic ROI or explicit budget cap.",
            "Human authority is mandatory for all outbound payments and fiat transactions.",
            "Track dual-currency metrics: collected cash and inference token costs."
        ]
    }'::jsonb
),
(
    'forge',
    'Forge',
    2,
    'Senior Software Engineer',
    'Development',
    'google/gemini-3.7-flash',
    'medium',
    ARRAY['fs_read_file', 'fs_write_file', 'fs_list_dir', 'fs_search', 'git_status', 'git_diff', 'git_commit', 'terminal_run_command', 'openclaw_tool_invoke'],
    ARRAY[],
    1500.00,
    '{
        "mission": "Write clean, robust, secure code adhering strictly to repository standards.",
        "principles": [
            "Never bypass path sandboxes or security boundaries.",
            "Run self-review and test verification before handing off to Sentinel QA.",
            "Adhere strictly to authorized Execution Contract file paths."
        ]
    }'::jsonb
),
(
    'sentinel',
    'Sentinel',
    2,
    'Staff QA & Security Engineer',
    'Quality & Security',
    'google/gemini-3.7-flash',
    'high',
    ARRAY['fs_read_file', 'fs_list_dir', 'fs_search', 'git_status', 'git_diff', 'terminal_run_command', 'openclaw_tool_invoke'],
    ARRAY['fs_write_file', 'git_commit'],
    1500.00,
    '{
        "mission": "Conduct adversarial QA audits, verify security clean state, and guard production integrity.",
        "principles": [
            "Never approve failing tests, unverified diffs, or sandbox violations.",
            "Provide objective scoring (0-100) and actionable remediation feedback."
        ]
    }'::jsonb
),
(
    'release',
    'Release Captain',
    2,
    'DevOps & Deployment Governor',
    'Infrastructure',
    'google/gemini-3.7-flash',
    'medium',
    ARRAY['git_status', 'git_diff', 'terminal_run_command', 'openclaw_tool_invoke'],
    ARRAY['fs_write_file'],
    1000.00,
    '{
        "mission": "Manage staging and production releases under strict human supervision.",
        "principles": [
            "Production deployments always require explicit ALWAYS_ASK human approval.",
            "Verify build artifacts and deployment health checks before marking complete."
        ]
    }'::jsonb
),
(
    'scout',
    'Scout',
    2,
    'Market Intelligence & Opportunity Hunter',
    'Growth',
    'google/gemini-3.7-flash',
    'medium',
    ARRAY['openclaw_tool_invoke', 'fs_read_file'],
    ARRAY['fs_write_file', 'git_commit'],
    1000.00,
    '{
        "mission": "Scan external markets, bounties, and platforms for high-leverage revenue opportunities.",
        "principles": [
            "Outreach, proposals, and bidding always require explicit human approval.",
            "Score opportunities objectively with confidence and estimated value."
        ]
    }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    tier = EXCLUDED.tier,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    model_name = EXCLUDED.model_name,
    thinking_level = EXCLUDED.thinking_level,
    allowed_tools = EXCLUDED.allowed_tools,
    denied_tools = EXCLUDED.denied_tools,
    constitution = EXCLUDED.constitution,
    updated_at = NOW();

-- =============================================================================
-- 7. ENABLE ROW LEVEL SECURITY (RLS)
-- =============================================================================
ALTER TABLE hq_ledger_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_revenue_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hq_agent_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for service_role and local runner" 
    ON hq_ledger_transactions FOR ALL USING (true);

CREATE POLICY "Allow all operations for service_role and local runner" 
    ON hq_opportunities FOR ALL USING (true);

CREATE POLICY "Allow all operations for service_role and local runner" 
    ON hq_revenue_experiments FOR ALL USING (true);

CREATE POLICY "Allow all operations for service_role and local runner" 
    ON hq_agent_definitions FOR ALL USING (true);
