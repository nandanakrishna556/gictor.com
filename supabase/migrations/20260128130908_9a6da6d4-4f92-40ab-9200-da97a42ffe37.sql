-- Add progress, last_frame_output, and last_frame_complete columns to pipelines table
ALTER TABLE public.pipelines 
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;

ALTER TABLE public.pipelines 
ADD COLUMN IF NOT EXISTS last_frame_output JSONB DEFAULT NULL;

ALTER TABLE public.pipelines 
ADD COLUMN IF NOT EXISTS last_frame_complete BOOLEAN DEFAULT false;

ALTER TABLE public.pipelines 
ADD COLUMN IF NOT EXISTS generation_started_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.pipelines 
ADD COLUMN IF NOT EXISTS estimated_duration_seconds INTEGER DEFAULT NULL;