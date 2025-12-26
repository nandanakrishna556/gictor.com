-- Add progress column to files table for tracking generation progress
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS progress integer DEFAULT 0;

-- Add a check constraint to ensure progress is between 0 and 100
ALTER TABLE public.files ADD CONSTRAINT files_progress_check CHECK (progress >= 0 AND progress <= 100);