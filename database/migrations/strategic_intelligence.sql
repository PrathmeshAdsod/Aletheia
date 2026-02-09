-- ============================================
-- Strategic Intelligence Engine Migration
-- Tables for Pulse, DNA, Insights, and Benchmarks
-- ============================================

-- Strategic DNA snapshots (organizational identity fingerprint)
CREATE TABLE IF NOT EXISTS strategic_dna (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    risk_appetite INT CHECK (risk_appetite >= 0 AND risk_appetite <= 100),
    decision_style INT CHECK (decision_style >= 0 AND decision_style <= 100), -- 0=centralized, 100=distributed
    conflict_tolerance INT CHECK (conflict_tolerance >= 0 AND conflict_tolerance <= 100),
    innovation_bias INT CHECK (innovation_bias >= 0 AND innovation_bias <= 100),
    decision_entropy INT CHECK (decision_entropy >= 0 AND decision_entropy <= 100),
    analysis_context JSONB DEFAULT '{}'::jsonb, -- supporting evidence
    calculated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for team-based retrieval
CREATE INDEX IF NOT EXISTS idx_strategic_dna_team_time 
    ON strategic_dna(team_id, calculated_at DESC);

-- Strategic Pulse (health snapshots with projections)
CREATE TABLE IF NOT EXISTS strategic_pulse (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    pulse_score INT CHECK (pulse_score >= 0 AND pulse_score <= 100),
    velocity FLOAT, -- decisions per day
    velocity_trend TEXT CHECK (velocity_trend IN ('accelerating', 'stable', 'decelerating')),
    conflict_momentum FLOAT, -- positive = rising, negative = falling
    coherence_score INT CHECK (coherence_score >= 0 AND coherence_score <= 100),
    phase TEXT CHECK (phase IN ('expansion', 'stabilization', 'pivot', 'churn', 'crisis')),
    signals JSONB DEFAULT '{}'::jsonb,
    projections JSONB DEFAULT '{}'::jsonb, -- trajectory forecasts
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for time-series queries
CREATE INDEX IF NOT EXISTS idx_strategic_pulse_team_time 
    ON strategic_pulse(team_id, created_at DESC);

-- Enhanced proactive insights (with projections and benchmarks)
CREATE TABLE IF NOT EXISTS proactive_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('risk', 'opportunity', 'forecast', 'dna', 'benchmark', 'pattern')),
    severity TEXT NOT NULL CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    evidence JSONB DEFAULT '[]'::jsonb,
    projection JSONB, -- for trajectory insights
    benchmark_data JSONB, -- for comparison insights
    suggested_action TEXT,
    expires_at TIMESTAMPTZ,
    dismissed BOOLEAN DEFAULT false,
    dismissed_by UUID REFERENCES auth.users(id),
    dismissed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for insights
CREATE INDEX IF NOT EXISTS idx_proactive_insights_team 
    ON proactive_insights(team_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proactive_insights_active 
    ON proactive_insights(team_id) WHERE dismissed = false;

-- Anonymous benchmark aggregates (for cross-team comparisons)
CREATE TABLE IF NOT EXISTS benchmark_aggregates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_size_bucket TEXT NOT NULL CHECK (team_size_bucket IN ('small', 'medium', 'large', 'enterprise')),
    metric_name TEXT NOT NULL,
    avg_value FLOAT,
    p25_value FLOAT,
    p50_value FLOAT,
    p75_value FLOAT,
    sample_count INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(team_size_bucket, metric_name)
);

-- ============================================
-- RLS Policies
-- ============================================

-- Strategic DNA
ALTER TABLE strategic_dna ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team members can view DNA" ON strategic_dna;
CREATE POLICY "Team members can view DNA" ON strategic_dna
    FOR SELECT USING (
        team_id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = auth.uid()
        )
    );

-- Strategic Pulse
ALTER TABLE strategic_pulse ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team members can view pulse" ON strategic_pulse;
CREATE POLICY "Team members can view pulse" ON strategic_pulse
    FOR SELECT USING (
        team_id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = auth.uid()
        )
    );

-- Proactive Insights
ALTER TABLE proactive_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team members can view insights" ON proactive_insights;
CREATE POLICY "Team members can view insights" ON proactive_insights
    FOR SELECT USING (
        team_id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Team members can dismiss insights" ON proactive_insights;
CREATE POLICY "Team members can dismiss insights" ON proactive_insights
    FOR UPDATE USING (
        team_id IN (
            SELECT team_id FROM team_members 
            WHERE user_id = auth.uid()
        )
    );

-- Benchmarks (public read for comparisons)
ALTER TABLE benchmark_aggregates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view benchmarks" ON benchmark_aggregates;
CREATE POLICY "Anyone can view benchmarks" ON benchmark_aggregates
    FOR SELECT USING (true);

-- ============================================
-- Grant service role access
-- ============================================
GRANT ALL ON strategic_dna TO service_role;
GRANT ALL ON strategic_pulse TO service_role;
GRANT ALL ON proactive_insights TO service_role;
GRANT ALL ON benchmark_aggregates TO service_role;
