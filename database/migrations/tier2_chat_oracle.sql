-- ============================================
-- Tier 2 Migration: Chat Messages & Oracle History
-- IDEMPOTENT VERSION - Safe to run multiple times
-- ============================================

-- Chat Messages Table (Team-shared conversations with AI)
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    sources JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast team-based retrieval
CREATE INDEX IF NOT EXISTS idx_chat_messages_team_time 
    ON chat_messages(team_id, created_at DESC);

-- Index for user's messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_user 
    ON chat_messages(user_id) WHERE user_id IS NOT NULL;

-- RLS Policies for chat_messages (drop if exists, then create)
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team members can view chat" ON chat_messages;
CREATE POLICY "Team members can view chat" ON chat_messages
    FOR SELECT USING (
        team_id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Team members can chat" ON chat_messages;
CREATE POLICY "Team members can chat" ON chat_messages
    FOR INSERT WITH CHECK (
        team_id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can clear chat" ON chat_messages;
CREATE POLICY "Admins can clear chat" ON chat_messages
    FOR DELETE USING (
        team_id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- Oracle Query History (Persistence for Oracle tab)
-- ============================================

CREATE TABLE IF NOT EXISTS oracle_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    citations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for team-based retrieval
CREATE INDEX IF NOT EXISTS idx_oracle_queries_team_time 
    ON oracle_queries(team_id, created_at DESC);

-- RLS Policies for oracle_queries (drop if exists, then create)
ALTER TABLE oracle_queries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team members can view oracle history" ON oracle_queries;
CREATE POLICY "Team members can view oracle history" ON oracle_queries
    FOR SELECT USING (
        team_id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Team members can query oracle" ON oracle_queries;
CREATE POLICY "Team members can query oracle" ON oracle_queries
    FOR INSERT WITH CHECK (
        team_id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- Grant service role access
-- ============================================
GRANT ALL ON chat_messages TO service_role;
GRANT ALL ON oracle_queries TO service_role;
