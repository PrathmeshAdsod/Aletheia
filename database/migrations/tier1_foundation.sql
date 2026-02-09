-- Aletheia Tier 1: Foundation Migration
-- Run this in Supabase SQL Editor

-- 1. Add importance columns to decisions table
ALTER TABLE decisions 
ADD COLUMN IF NOT EXISTS importance TEXT DEFAULT 'medium' 
  CHECK (importance IN ('low', 'medium', 'strategic', 'critical'));

ALTER TABLE decisions 
ADD COLUMN IF NOT EXISTS importance_source TEXT DEFAULT 'ai'
  CHECK (importance_source IN ('ai', 'manual'));

-- 2. Create score history table for trend tracking
CREATE TABLE IF NOT EXISTS score_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    recorded_at DATE DEFAULT CURRENT_DATE,
    
    -- 5 Health Scores (0-100)
    alignment_score NUMERIC(5,2) NOT NULL,
    stability_score NUMERIC(5,2) NOT NULL,
    velocity_score NUMERIC(5,2) NOT NULL,
    resolution_score NUMERIC(5,2) NOT NULL,
    clarity_score NUMERIC(5,2) NOT NULL,
    
    -- Overall composite
    overall_score NUMERIC(5,2) NOT NULL,
    
    -- Metadata
    decision_count INTEGER,
    conflict_count INTEGER
);

-- Create unique constraint (one snapshot per day per team)
CREATE UNIQUE INDEX IF NOT EXISTS idx_score_history_team_date_unique 
ON score_history(team_id, recorded_at);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_score_history_team_lookup 
ON score_history(team_id, recorded_at DESC);
