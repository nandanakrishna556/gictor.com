-- Drop the old constraint and add a new one with all valid stages
ALTER TABLE public.pipelines DROP CONSTRAINT pipelines_current_stage_check;

ALTER TABLE public.pipelines ADD CONSTRAINT pipelines_current_stage_check 
CHECK (current_stage = ANY (ARRAY[
  'first_frame'::text, 
  'last_frame'::text,
  'script'::text, 
  'voice'::text, 
  'speech'::text,
  'animate'::text,
  'lip_sync'::text,
  'final_video'::text
]));