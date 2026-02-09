-- ================================
-- ALETHEIA PRODUCTION DATABASE SCHEMA
-- ================================
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/_/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================
-- TABLE: decisions
-- Stores all extracted decision nodes
-- ================================
CREATE TABLE IF NOT EXISTS decisions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  decision_id TEXT UNIQUE NOT NULL,
  source_type TEXT NOT NULL, -- 'document', 'slack', 'github', 'video'
  source_ref TEXT, -- File name, Slack message ID, GitHub PR number, etc.
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  schema_version TEXT DEFAULT 'v1',
  full_json JSONB NOT NULL, -- Complete CME decision JSON
  file_hash TEXT, -- SHA-256 hash for deduplication
  upload_sequence INTEGER, -- Order of upload (for chronological accuracy)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_decisions_decision_id ON decisions(decision_id);
CREATE INDEX IF NOT EXISTS idx_decisions_source_type ON decisions(source_type);
CREATE INDEX IF NOT EXISTS idx_decisions_file_hash ON decisions(file_hash);
CREATE INDEX IF NOT EXISTS idx_decisions_upload_sequence ON decisions(upload_sequence);
CREATE INDEX IF NOT EXISTS idx_decisions_created_at ON decisions(created_at DESC);

-- ================================
-- TABLE: conflicts
-- Stores detected decision conflicts
-- ================================
CREATE TABLE IF NOT EXISTS conflicts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flag_type TEXT NOT NULL, -- 'RED', 'YELLOW'
  severity INTEGER CHECK (severity BETWEEN 1 AND 10),
  decision_a_id TEXT NOT NULL,
  decision_b_id TEXT NOT NULL,
  conflict_reason TEXT,
  conflict_path JSONB, -- Array of decision IDs showing conflict path
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conflicts_resolved ON conflicts(resolved);
CREATE INDEX IF NOT EXISTS idx_conflicts_severity ON conflicts(severity DESC);
CREATE INDEX IF NOT EXISTS idx_conflicts_decision_a ON conflicts(decision_a_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_decision_b ON conflicts(decision_b_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_detected_at ON conflicts(detected_at DESC);

-- ================================
-- TABLE: upload_jobs
-- Async job tracking for large uploads
-- ================================
CREATE TABLE IF NOT EXISTS upload_jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'complete', 'failed'
  file_name TEXT,
  file_size BIGINT,
  file_hash TEXT,
  decisions_extracted INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_upload_jobs_status ON upload_jobs(status);
CREATE INDEX IF NOT EXISTS idx_upload_jobs_job_id ON upload_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_upload_jobs_created_at ON upload_jobs(created_at DESC);

-- ================================
-- TABLE: users (for future auth)
-- ================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  organization TEXT,
  role TEXT DEFAULT 'user', -- 'admin', 'user', 'viewer'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ================================
-- TABLE: organizations
-- ================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'free', -- 'free', 'pro', 'enterprise'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================
-- FUNCTIONS: Auto-update timestamps
-- ================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply auto-update triggers
DROP TRIGGER IF EXISTS update_decisions_updated_at ON decisions;
CREATE TRIGGER update_decisions_updated_at BEFORE UPDATE ON decisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_upload_jobs_updated_at ON upload_jobs;
CREATE TRIGGER update_upload_jobs_updated_at BEFORE UPDATE ON upload_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- ROW LEVEL SECURITY (RLS)
-- Enable for production security
-- ================================
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Public access for demo/MVP (change for production multi-tenant)
DROP POLICY IF EXISTS "Allow all access to decisions" ON decisions;
CREATE POLICY "Allow all access to decisions" ON decisions FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to conflicts" ON conflicts;
CREATE POLICY "Allow all access to conflicts" ON conflicts FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to upload_jobs" ON upload_jobs;
CREATE POLICY "Allow all access to upload_jobs" ON upload_jobs FOR ALL USING (true);

-- ================================
-- VERIFICATION QUERIES
-- ================================
-- Run these to verify setup:

-- Check tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Insert test decision
INSERT INTO decisions (decision_id, source_type, source_ref, full_json)
VALUES (
  'test-001',
  'document',
  'system-initialization.txt',
  '{"decision_id": "test-001", "actor": "system", "decision": "Database initialized", "sentiment": "NEUTRAL", "timestamp": "2026-02-07T23:00:00Z"}'::jsonb
)
ON CONFLICT (decision_id) DO NOTHING;

-- Verify insert
SELECT decision_id, source_type, created_at FROM decisions WHERE decision_id = 'test-001';

-- ✅ Production schema ready!
