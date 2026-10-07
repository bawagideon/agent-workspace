-- ==============================================================================
-- GIDEON AI HQ V7 — FINANCIAL CONTROL PLANE & COMMERCE GATES
-- Migration: 20260927000000_v7_financial_control_plane.sql
-- Architectural Guarantees:
-- 1. Unique Provider Event Idempotency (provider_event_id PRIMARY KEY)
-- 2. Atomic Spend Reservations with Status Machine & Expiration (hq_spend_reservations)
-- 3. Append-Only Financial Ledger (hq_ledger_transactions integration)
-- 4. Derived Materialized Projections on hq_projects
-- ==============================================================================

-- 1. Processed Provider Events (Strict Webhook Deduplication)
CREATE TABLE IF NOT EXISTS hq_processed_provider_events (
  provider_event_id VARCHAR(128) PRIMARY KEY,
  provider VARCHAR(32) NOT NULL DEFAULT 'stripe',
  event_type VARCHAR(64) NOT NULL,
  project_id VARCHAR(64) REFERENCES hq_projects(id) ON DELETE SET NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processed_events_project
  ON hq_processed_provider_events(project_id, processed_at DESC);

-- 2. Spend Reservations Table (Atomic Pre-Allocation Holds)
CREATE TABLE IF NOT EXISTS hq_spend_reservations (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL REFERENCES hq_projects(id) ON DELETE RESTRICT,
  amount_cents NUMERIC(14, 2) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, SETTLED, RELEASED, EXPIRED
  task_id VARCHAR(128),
  agent_id VARCHAR(64),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  settled_at TIMESTAMPTZ,
  settled_amount_cents NUMERIC(14, 2) DEFAULT 0.00
);

CREATE INDEX IF NOT EXISTS idx_spend_reservations_project_status
  ON hq_spend_reservations(project_id, status);

CREATE INDEX IF NOT EXISTS idx_spend_reservations_expires
  ON hq_spend_reservations(expires_at)
  WHERE status = 'ACTIVE';

-- 3. Add Financial Control Plane Columns to hq_projects (Projections)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hq_projects' AND column_name='budget_cap_cents') THEN
    ALTER TABLE hq_projects ADD COLUMN budget_cap_cents BIGINT DEFAULT 10000;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hq_projects' AND column_name='cash_received_cents') THEN
    ALTER TABLE hq_projects ADD COLUMN cash_received_cents NUMERIC(14, 2) DEFAULT 0.00;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hq_projects' AND column_name='settled_spend_cents') THEN
    ALTER TABLE hq_projects ADD COLUMN settled_spend_cents NUMERIC(14, 2) DEFAULT 0.00;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hq_projects' AND column_name='reserved_spend_cents') THEN
    ALTER TABLE hq_projects ADD COLUMN reserved_spend_cents NUMERIC(14, 2) DEFAULT 0.00;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hq_projects' AND column_name='payment_state') THEN
    ALTER TABLE hq_projects ADD COLUMN payment_state VARCHAR(32) DEFAULT 'UNFUNDED';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hq_projects' AND column_name='minimum_deposit_cents') THEN
    ALTER TABLE hq_projects ADD COLUMN minimum_deposit_cents BIGINT DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hq_projects' AND column_name='deposit_percentage') THEN
    ALTER TABLE hq_projects ADD COLUMN deposit_percentage NUMERIC(5, 2) DEFAULT 50.00;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hq_projects' AND column_name='stripe_customer_id') THEN
    ALTER TABLE hq_projects ADD COLUMN stripe_customer_id VARCHAR(128);
  END IF;
END $$;
