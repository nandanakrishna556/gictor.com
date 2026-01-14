-- Add sort_order column to files table for manual kanban ordering
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Add sort_order column to folders table for manual kanban ordering
ALTER TABLE public.folders ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Create index for faster sorting
CREATE INDEX IF NOT EXISTS idx_files_sort_order ON public.files(project_id, status, sort_order);
CREATE INDEX IF NOT EXISTS idx_folders_sort_order ON public.folders(project_id, status, sort_order);