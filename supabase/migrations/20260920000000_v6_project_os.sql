-- ==============================================================================
-- GIDEON AI HQ V6 — PROJECT OPERATING SYSTEM (PROJECT OS)
-- Migration: 20260920000000_v6_project_os.sql
-- Architectural Guarantees:
-- 1. Optimistic Concurrency Control (revision BIGINT)
-- 2. Immutable Event Stream with Deterministic Idempotency (event_id UNIQUE)
-- 3. Non-Cascading Historical Provenance (ON DELETE RESTRICT)
-- 4. Disk-Isolated Artifact Logging (artifact_id reference, no raw text bloat)
-- ==============================================================================

-- 1. Core Projects Table
CREATE TABLE IF NOT EXISTS hq_projects (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL, -- SAAS, CLIENT_SERVICE, API_SERVICE, INTERNAL_TOOL, AUTOMATION
  status VARCHAR(64) NOT NULL DEFAULT 'DISCOVERY', -- DISCOVERY, BUILDING, TESTING, QA_VERIFIED, STAGING, CLIENT_REVIEW, DEPLOYED, ARCHIVED, DECOMMISSIONED
  workspace_path VARCHAR(255) NOT NULL,
  repository VARCHAR(255),
  current_version VARCHAR(32) NOT NULL DEFAULT 'v0.1.0',
  revision BIGINT NOT NULL DEFAULT 0, -- Optimistic concurrency control
  business_objective TEXT NOT NULL,
  target_customer TEXT,
  problem_solved TEXT,
  pricing_cents BIGINT DEFAULT 0,
  currency VARCHAR(8) DEFAULT 'USD',
  build_cost_cents BIGINT DEFAULT 0,
  total_tokens_used BIGINT DEFAULT 0,
  health_status VARCHAR(32) DEFAULT 'HEALTHY',
  active_port INT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Project Events Stream (Immutable append-only audit trail)
CREATE TABLE IF NOT EXISTS hq_project_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(64) UNIQUE NOT NULL,
  project_id VARCHAR(64) NOT NULL REFERENCES hq_projects(id) ON DELETE RESTRICT,
  event_type VARCHAR(64) NOT NULL,
  actor VARCHAR(64) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Project Missions Linkage (What happened + Why it happened)
CREATE TABLE IF NOT EXISTS hq_project_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR(64) NOT NULL REFERENCES hq_projects(id) ON DELETE RESTRICT,
  mission_id VARCHAR(64) NOT NULL,
  mission_title VARCHAR(255) NOT NULL,
  objective TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  assigned_role VARCHAR(64) NOT NULL,
  cost_cents BIGINT DEFAULT 0,
  tokens_used BIGINT DEFAULT 0,
  evidence_id VARCHAR(128),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 4. Project Test Runs (Evidence-based quality, artifact-backed)
CREATE TABLE IF NOT EXISTS hq_project_test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR(64) NOT NULL REFERENCES hq_projects(id) ON DELETE RESTRICT,
  suite_name VARCHAR(128) NOT NULL,
  command VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL, -- PASS, FAIL, BLOCKED, SKIPPED, FLAKY
  passed_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  skipped_count INT NOT NULL DEFAULT 0,
  duration_ms INT NOT NULL DEFAULT 0,
  exit_code INT NOT NULL DEFAULT 0,
  git_commit VARCHAR(64),
  artifact_id VARCHAR(128), -- Reference to stored log artifact, NOT raw text
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Project Runner Leases (Lease-based supervisor & port management)
CREATE TABLE IF NOT EXISTS hq_project_runner_leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR(64) NOT NULL REFERENCES hq_projects(id) ON DELETE RESTRICT,
  runner_id VARCHAR(64) NOT NULL,
  pid INT NOT NULL,
  port INT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  heartbeat_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  exit_code INT
);

-- Indices for rapid lookup
CREATE INDEX IF NOT EXISTS idx_hq_projects_status ON hq_projects(status);
CREATE INDEX IF NOT EXISTS idx_hq_project_events_pid ON hq_project_events(project_id);
CREATE INDEX IF NOT EXISTS idx_hq_project_missions_pid ON hq_project_missions(project_id);
CREATE INDEX IF NOT EXISTS idx_hq_project_test_runs_pid ON hq_project_test_runs(project_id);
