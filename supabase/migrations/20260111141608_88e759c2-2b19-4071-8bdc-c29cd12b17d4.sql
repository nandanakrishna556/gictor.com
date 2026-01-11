-- Add script_output column to files table for storing generated scripts
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS script_output TEXT;