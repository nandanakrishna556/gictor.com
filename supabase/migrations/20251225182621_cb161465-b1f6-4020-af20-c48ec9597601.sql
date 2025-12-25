-- Create table for user-defined pipelines with custom stages
CREATE TABLE public.user_pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  stages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_pipelines ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own pipelines"
ON public.user_pipelines FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pipelines"
ON public.user_pipelines FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pipelines"
ON public.user_pipelines FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pipelines"
ON public.user_pipelines FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_pipelines_updated_at
BEFORE UPDATE ON public.user_pipelines
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();