-- =============================================================================
-- GIDEON AI HQ — V5.2 COMMAND COCKPIT & DURABLE CONVERSATIONS
-- Version: 5.2.0
-- =============================================================================

-- =============================================================================
-- 1. DURABLE CONVERSATIONS (hq_conversations)
-- =============================================================================
CREATE TABLE IF NOT EXISTS hq_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL DEFAULT 'New Gideon Session',
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'ARCHIVED', 'PAUSED'
    context_type TEXT NOT NULL DEFAULT 'GLOBAL', -- 'GLOBAL', 'OPPORTUNITY', 'TASK', 'WORKSPACE', 'AGENT'
    context_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_status_updated 
    ON hq_conversations(status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_context 
    ON hq_conversations(context_type, context_id);

-- =============================================================================
-- 2. CONVERSATION MESSAGES & EXECUTION TRACES (hq_conversation_messages)
-- =============================================================================
CREATE TABLE IF NOT EXISTS hq_conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES hq_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user', -- 'user', 'assistant', 'system', 'agent'
    agent_id TEXT, -- 'atlas', 'forge', 'sentinel', 'ledger', 'scout', 'release'
    content TEXT NOT NULL,
    command_verb TEXT, -- 'INVESTIGATE', 'EXPERIMENT', 'STATUS', 'BRIEFING', 'PAUSE', 'RESUME', 'APPROVE', 'REJECT', 'KILLSWITCH', 'CREATE_MISSION', 'WHY_NOT', 'ASK'
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

CREATE INDEX IF NOT EXISTS idx_conv_messages_mission 
    ON hq_conversation_messages(mission_id) 
    WHERE mission_id IS NOT NULL;

-- Enable Realtime for conversation messages if publications exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE hq_conversations;
        ALTER PUBLICATION supabase_realtime ADD TABLE hq_conversation_messages;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Ignore if already added or permission denied
    NULL;
END $$;
