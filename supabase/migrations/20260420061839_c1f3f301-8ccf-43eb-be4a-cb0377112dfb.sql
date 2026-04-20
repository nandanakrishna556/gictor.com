ALTER TABLE public.pipelines
  ADD COLUMN IF NOT EXISTS last_credits_cost numeric,
  ADD COLUMN IF NOT EXISTS last_credits_stage text;