-- Drop the existing check constraint
ALTER TABLE public.pipelines DROP CONSTRAINT IF EXISTS pipelines_type_check;

-- Add updated check constraint that includes motion_graphics
ALTER TABLE public.pipelines ADD CONSTRAINT pipelines_type_check 
CHECK (pipeline_type IN ('talking_head', 'lip_sync', 'clips', 'motion_graphics'));