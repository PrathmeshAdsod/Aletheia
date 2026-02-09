-- Fix proactive_insights category constraint to allow 'briefing'

-- 1. Drop existing constraint
ALTER TABLE proactive_insights DROP CONSTRAINT IF EXISTS proactive_insights_category_check;

-- 2. Sanitize existing data: Convert any unknown categories to 'pattern' (safe default)
-- This ensures the subsequent constraint application won't fail due to existing invalid rows
UPDATE proactive_insights 
SET category = 'pattern' 
WHERE category NOT IN ('risk', 'opportunity', 'forecast', 'dna', 'benchmark', 'pattern', 'briefing');

-- 3. Apply the new constraint
ALTER TABLE proactive_insights 
  ADD CONSTRAINT proactive_insights_category_check 
  CHECK (category IN ('risk', 'opportunity', 'forecast', 'dna', 'benchmark', 'pattern', 'briefing'));
