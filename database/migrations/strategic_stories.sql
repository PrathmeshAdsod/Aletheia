-- Strategic Stories Table
-- Stores generated strategic evolution narratives

CREATE TABLE IF NOT EXISTS strategic_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    story_data JSONB NOT NULL,
    timespan_start TIMESTAMPTZ NOT NULL,
    timespan_end TIMESTAMPTZ NOT NULL,
    decision_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_strategic_stories_team 
    ON strategic_stories(team_id, created_at DESC);

-- RLS Policies
ALTER TABLE strategic_stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team members can view stories" ON strategic_stories;
CREATE POLICY "Team members can view stories" ON strategic_stories
    FOR SELECT USING (
        team_id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = auth.uid()
        )
    );

-- Grant service role access
GRANT ALL ON strategic_stories TO service_role;
