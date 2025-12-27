-- Add display_status column to pipelines table for Kanban column assignment
-- This is separate from 'status' which is constrained to processing states
ALTER TABLE public.pipelines 
ADD COLUMN display_status TEXT DEFAULT NULL;

-- Add a comment explaining the difference
COMMENT ON COLUMN public.pipelines.display_status IS 'User-defined status for Kanban display (e.g. draft, review, approved). Separate from status which tracks processing state.';