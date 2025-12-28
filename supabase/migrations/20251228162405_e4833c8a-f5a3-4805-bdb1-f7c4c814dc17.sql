-- Add pipeline_type column to differentiate between talking_head and b_roll pipelines
ALTER TABLE public.pipelines 
ADD COLUMN pipeline_type text NOT NULL DEFAULT 'talking_head';

-- Add a check constraint to ensure valid pipeline types
ALTER TABLE public.pipelines 
ADD CONSTRAINT pipelines_type_check CHECK (pipeline_type IN ('talking_head', 'b_roll'));