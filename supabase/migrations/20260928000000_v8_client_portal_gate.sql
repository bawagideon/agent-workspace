-- ==============================================================================
-- GIDEON AI HQ V8 — CLIENT PORTAL & PUBLIC EXPOSURE GATE
-- Migration: 20260928000000_v8_client_portal_gate.sql
-- Invariants:
--   1. Authoritative server-side portal access credentials with SHA-256 secret hashes
--   2. Truly one-time bootstrap tracking (used_at) preventing replay attacks
--   3. Opaque server-authoritative sessions with SHA-256 session token hashes
--   4. Composite idempotency tracking (project_id, idempotency_key) with request fingerprinting
--   5. Soft revocation & ON DELETE RESTRICT preserving historical audit trail
-- ==============================================================================

-- 1. Portal Access (Share credentials issued by operator)
CREATE TABLE IF NOT EXISTS hq_portal_access (
  id VARCHAR(64) PRIMARY KEY, -- opaque shareId (UUID or random string)
  project_id VARCHAR(64) NOT NULL REFERENCES hq_projects(id) ON DELETE RESTRICT,
  credential_hash VARCHAR(128) NOT NULL, -- SHA-256 hash of access secret
  permissions TEXT[] NOT NULL DEFAULT ARRAY['preview:read', 'feedback:write', 'milestone:accept'],
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ, -- Set on first bootstrap; blocks replay
  revoked_at TIMESTAMPTZ, -- Set when operator revokes access
  created_by VARCHAR(64) NOT NULL DEFAULT 'human',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INT NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_portal_access_project ON hq_portal_access(project_id);
CREATE INDEX IF NOT EXISTS idx_portal_access_revoked ON hq_portal_access(revoked_at);
CREATE INDEX IF NOT EXISTS idx_portal_access_used ON hq_portal_access(used_at);

-- 2. Portal Sessions (Active opaque sessions authenticated via HttpOnly cookie)
CREATE TABLE IF NOT EXISTS hq_portal_sessions (
  id VARCHAR(64) PRIMARY KEY,
  session_hash VARCHAR(128) NOT NULL UNIQUE, -- SHA-256 hash of cookie token
  share_id VARCHAR(64) NOT NULL REFERENCES hq_portal_access(id) ON DELETE RESTRICT,
  project_id VARCHAR(64) NOT NULL REFERENCES hq_projects(id) ON DELETE RESTRICT,
  permissions TEXT[] NOT NULL,
  csrf_token VARCHAR(128) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ, -- Instant session killswitch
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portal_sessions_hash ON hq_portal_sessions(session_hash);
CREATE INDEX IF NOT EXISTS idx_portal_sessions_project ON hq_portal_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_portal_sessions_share ON hq_portal_sessions(share_id);

-- 3. Portal Feedback Idempotency (Composite idempotency with request fingerprinting)
CREATE TABLE IF NOT EXISTS hq_portal_feedback_idempotency (
  project_id VARCHAR(64) NOT NULL REFERENCES hq_projects(id) ON DELETE RESTRICT,
  idempotency_key VARCHAR(128) NOT NULL,
  share_id VARCHAR(64) NOT NULL REFERENCES hq_portal_access(id) ON DELETE RESTRICT,
  request_hash VARCHAR(128) NOT NULL, -- SHA-256 hash of payload
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  response_payload JSONB NOT NULL,
  PRIMARY KEY (project_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_portal_idempotency_key ON hq_portal_feedback_idempotency(project_id, idempotency_key);
