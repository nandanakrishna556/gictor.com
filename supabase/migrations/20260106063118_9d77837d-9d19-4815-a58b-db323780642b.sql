-- Add generation timing columns to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS generation_started_at TIMESTAMPTZ;
ALTER TABLE files ADD COLUMN IF NOT EXISTS estimated_duration_seconds INTEGER;

-- Add generation timing columns to actors table
ALTER TABLE actors ADD COLUMN IF NOT EXISTS generation_started_at TIMESTAMPTZ;
ALTER TABLE actors ADD COLUMN IF NOT EXISTS estimated_duration_seconds INTEGER;