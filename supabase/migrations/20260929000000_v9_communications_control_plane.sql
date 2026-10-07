-- ==============================================================================
-- GIDEON AI HQ V9 — COMMUNICATIONS CONTROL PLANE & NERVOUS SYSTEM
-- Migration: 20260929000000_v9_communications_control_plane.sql
-- Invariants:
--   1. Strict Contact Identity: Inbound senders bound to verified contacts or flagged UNVERIFIED_SENDER
--   2. Optimistic Concurrency Control (OCC): version tracking on conversations and drafts
--   3. Quarantined Raw Payloads: raw_content restricted to forensic audit; sanitized_content for agents
--   4. Cryptographic Outbound Approvals: approvals bound to content_hash, draft_version, and conversation_version
--   5. Anti-Replay: used_at single-use marker and expires_at TTL
-- ==============================================================================

-- 1. Contacts Registry (Authoritative identity mapping)
CREATE TABLE IF NOT EXISTS hq_contacts (
  id VARCHAR(64) PRIMARY KEY,
  client_id VARCHAR(64) NOT NULL,
  name VARCHAR(128) NOT NULL,
  primary_contact VARCHAR(255) NOT NULL,
  verified_channels TEXT[] NOT NULL DEFAULT ARRAY['DIRECT'],
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_client ON hq_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_contacts_primary ON hq_contacts(primary_contact);

-- 2. Conversations (Support existing table & expand with communications schema)
CREATE TABLE IF NOT EXISTS hq_conversations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'New Gideon Session',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  context_type TEXT NOT NULL DEFAULT 'GLOBAL',
  context_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safely add Phase 6.5 Communications columns if table already exists from prior migrations
ALTER TABLE hq_conversations 
  ADD COLUMN IF NOT EXISTS opportunity_id TEXT,
  ADD COLUMN IF NOT EXISTS project_id VARCHAR(64) REFERENCES hq_projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS contact_id VARCHAR(64) REFERENCES hq_contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS channel VARCHAR(32) NOT NULL DEFAULT 'DIRECT',
  ADD COLUMN IF NOT EXISTS external_thread_id VARCHAR(255) DEFAULT '',
  ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS stage VARCHAR(32) NOT NULL DEFAULT 'PROSPECTING',
  ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_conversations_opp ON hq_conversations(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_conversations_proj ON hq_conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON hq_conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_thread ON hq_conversations(external_thread_id);

-- 3. Messages (Multi-turn conversational history with sanitization & classifications)
CREATE TABLE IF NOT EXISTS hq_messages (
  id VARCHAR(64) PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES hq_conversations(id) ON DELETE CASCADE,
  direction VARCHAR(16) NOT NULL,
  sender VARCHAR(255) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  raw_content TEXT NOT NULL,
  sanitized_content TEXT NOT NULL,
  external_message_id VARCHAR(255) NOT NULL UNIQUE,
  classification VARCHAR(32),
  classification_reason TEXT,
  acceptance_confidence VARCHAR(32) DEFAULT 'NONE',
  scope_analysis JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conv ON hq_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_ext_id ON hq_messages(external_message_id);

-- 4. Message Drafts (Atlas-prepared responses awaiting human authorization)
CREATE TABLE IF NOT EXISTS hq_message_drafts (
  id VARCHAR(64) PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES hq_conversations(id) ON DELETE CASCADE,
  reply_to_message_id VARCHAR(64) REFERENCES hq_messages(id) ON DELETE SET NULL,
  draft_text TEXT NOT NULL,
  content_hash VARCHAR(64) NOT NULL,
  author_agent VARCHAR(32) NOT NULL DEFAULT 'atlas',
  status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
  change_order_cents INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INT NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_drafts_conv ON hq_message_drafts(conversation_id);
CREATE INDEX IF NOT EXISTS idx_drafts_status ON hq_message_drafts(status);

-- 5. Outbound Message Approvals (Cryptographically bound human authorization)
CREATE TABLE IF NOT EXISTS hq_message_approvals (
  id VARCHAR(64) PRIMARY KEY,
  draft_id VARCHAR(64) NOT NULL REFERENCES hq_message_drafts(id) ON DELETE CASCADE,
  draft_version INT NOT NULL,
  conversation_version INT NOT NULL,
  content_hash VARCHAR(64) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  channel VARCHAR(32) NOT NULL,
  operator_id VARCHAR(64) NOT NULL,
  signature VARCHAR(128) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approvals_draft ON hq_message_approvals(draft_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON hq_message_approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_hash ON hq_message_approvals(content_hash);
