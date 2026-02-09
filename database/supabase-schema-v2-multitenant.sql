-- ==========================================
-- ALETHEIA V2: MULTI-TENANT SCHEMA
-- ==========================================
-- Run this in Supabase SQL Editor after backing up existing data
-- This implements: Organization → Teams → Users hierarchy

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- STEP 1: CLEAN START (Delete old data)
-- ==========================================
-- Per approved decision: Fresh start
TRUNCATE TABLE conflicts CASCADE;
TRUNCATE TABLE decisions CASCADE;  
TRUNCATE TABLE upload_jobs CASCADE;

-- ==========================================
-- STEP 2: UPDATE ORGANIZATIONS TABLE
-- ==========================================
-- This table already exists, ensure it's correct
ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- ==========================================
-- STEP 3: CREATE TEAMS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate team names within same organization
  UNIQUE(organization_id, name),
  UNIQUE(organization_id, slug)
);

CREATE INDEX idx_teams_organization_id ON teams(organization_id);
CREATE INDEX idx_teams_slug ON teams(slug);

-- Auto-update timestamps
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- STEP 4: CREATE TEAM_MEMBERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id),
  
  -- User can only have one role per team
  UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_role ON team_members(role);

-- ==========================================
-- STEP 5: UPDATE USERS TABLE
-- ==========================================
-- Remove old single-tenant fields
ALTER TABLE users DROP COLUMN IF EXISTS organization;
ALTER TABLE users DROP COLUMN IF EXISTS role;

-- Add new fields
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- ==========================================
-- STEP 6: UPDATE DECISIONS TABLE
-- ==========================================
-- Add multi-tenant columns
ALTER TABLE decisions 
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id);

-- Make team_id required for new rows (existing rows are already deleted)
-- We'll enforce this in application logic

CREATE INDEX idx_decisions_organization_id ON decisions(organization_id);
CREATE INDEX idx_decisions_team_id ON decisions(team_id);
CREATE INDEX idx_decisions_uploaded_by ON decisions(uploaded_by);

-- ==========================================
-- STEP 7: UPDATE UPLOAD_JOBS TABLE
-- ==========================================
ALTER TABLE upload_jobs
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id);

CREATE INDEX idx_upload_jobs_organization_id ON upload_jobs(organization_id);
CREATE INDEX idx_upload_jobs_team_id ON upload_jobs(team_id);
CREATE INDEX idx_upload_jobs_uploaded_by ON upload_jobs(uploaded_by);

-- ==========================================
-- STEP 8: UPDATE CONFLICTS TABLE
-- ==========================================
ALTER TABLE conflicts
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE CASCADE;

CREATE INDEX idx_conflicts_organization_id ON conflicts(organization_id);
CREATE INDEX idx_conflicts_team_id ON conflicts(team_id);

-- ==========================================
-- STEP 9: ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- TEAMS RLS POLICIES
-- ==========================================

-- Users can see teams they're members of
DROP POLICY IF EXISTS "Users can view their teams" ON teams;
CREATE POLICY "Users can view their teams" ON teams
  FOR SELECT
  USING (
    id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Only organization admins can create teams (enforced in app logic)
DROP POLICY IF EXISTS "Org admins can create teams" ON teams;
CREATE POLICY "Org admins can create teams" ON teams
  FOR INSERT
  WITH CHECK (true); -- Will be enforced in application

-- Team admins can update their team
DROP POLICY IF EXISTS "Team admins can update teams" ON teams;
CREATE POLICY "Team admins can update teams" ON teams
  FOR UPDATE
  USING (
    id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ==========================================
-- TEAM_MEMBERS RLS POLICIES
-- ==========================================

-- Users can see members of their teams
DROP POLICY IF EXISTS "Users can view team members" ON team_members;
CREATE POLICY "Users can view team members" ON team_members
  FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Team admins can add members
DROP POLICY IF EXISTS "Team admins can add members" ON team_members;
CREATE POLICY "Team admins can add members" ON team_members
  FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Team admins can update member roles
DROP POLICY IF EXISTS "Team admins can update roles" ON team_members;
CREATE POLICY "Team admins can update roles" ON team_members
  FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Team admins can remove members
DROP POLICY IF EXISTS "Team admins can remove members" ON team_members;
CREATE POLICY "Team admins can remove members" ON team_members
  FOR DELETE
  USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ==========================================
-- DECISIONS RLS POLICIES
-- ==========================================

-- Remove old policy
DROP POLICY IF EXISTS "Allow all access to decisions" ON decisions;

-- Users can only see decisions from their teams
DROP POLICY IF EXISTS "Team members can read decisions" ON decisions;
CREATE POLICY "Team members can read decisions" ON decisions
  FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Members and admins can insert decisions
DROP POLICY IF EXISTS "Members can create decisions" ON decisions;
CREATE POLICY "Members can create decisions" ON decisions
  FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND role IN ('admin', 'member')
    )
  );

-- Admins can update decisions (for sequencing)
DROP POLICY IF EXISTS "Admins can update decisions" ON decisions;
CREATE POLICY "Admins can update decisions" ON decisions
  FOR UPDATE
  USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete decisions
DROP POLICY IF EXISTS "Admins can delete decisions" ON decisions;
CREATE POLICY "Admins can delete decisions" ON decisions
  FOR DELETE
  USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ==========================================
-- UPLOAD_JOBS RLS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Allow all access to upload_jobs" ON upload_jobs;

DROP POLICY IF EXISTS "Team members can view jobs" ON upload_jobs;
CREATE POLICY "Team members can view jobs" ON upload_jobs
  FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can create jobs" ON upload_jobs;
CREATE POLICY "Members can create jobs" ON upload_jobs
  FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND role IN ('admin', 'member')
    )
  );

-- ==========================================
-- CONFLICTS RLS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Allow all access to conflicts" ON conflicts;

DROP POLICY IF EXISTS "Team members can view conflicts" ON conflicts;
CREATE POLICY "Team members can view conflicts" ON conflicts
  FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- ==========================================
-- STEP 10: CREATE DEMO DATA
-- ==========================================

-- Create Demo Organization
INSERT INTO organizations (id, name, slug, plan)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Demo Organization',
  'demo-org',
  'free'
) ON CONFLICT (id) DO NOTHING;

-- Create Demo Team
INSERT INTO teams (id, organization_id, name, slug, description)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Demo Team',
  'demo-team',
  'Default team for testing and development'
) ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Check all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check teams table
SELECT * FROM teams;

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check policies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ✅ Multi-tenant schema ready!
-- Next: Configure Supabase Auth and implement backend services
