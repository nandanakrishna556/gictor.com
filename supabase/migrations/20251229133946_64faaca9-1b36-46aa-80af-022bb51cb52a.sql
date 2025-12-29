-- First drop the existing check constraint
ALTER TABLE public.pipelines DROP CONSTRAINT IF EXISTS pipelines_type_check;

-- Update existing b_roll values to clips (do this BEFORE adding new constraint)
UPDATE public.pipelines 
SET pipeline_type = 'clips' 
WHERE pipeline_type = 'b_roll';

-- Now add new check constraint that allows 'clips' instead of 'b_roll'
ALTER TABLE public.pipelines ADD CONSTRAINT pipelines_type_check 
CHECK (pipeline_type IN ('talking_head', 'clips'));

-- Update existing files with b_roll file_type to clips
UPDATE public.files 
SET file_type = 'clips' 
WHERE file_type = 'b_roll';

-- Update generation_params that reference b_roll pipeline_type
UPDATE public.files 
SET generation_params = jsonb_set(generation_params, '{pipeline_type}', '"clips"')
WHERE generation_params->>'pipeline_type' = 'b_roll';