-- Add generation_status column to files table
ALTER TABLE public.files 
ADD COLUMN IF NOT EXISTS generation_status text DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.files.generation_status IS 'Tracks generation progress (pending, processing, completed, failed) without affecting kanban workflow status';