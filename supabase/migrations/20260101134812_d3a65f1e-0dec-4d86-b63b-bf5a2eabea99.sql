-- Create actors table
CREATE TABLE public.actors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Untitled Actor',
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  age text,
  gender text,
  accent text,
  physical_details jsonb DEFAULT '{}'::jsonb,
  personality_details jsonb DEFAULT '{}'::jsonb,
  voice_details jsonb DEFAULT '{}'::jsonb,
  custom_image_url text,
  custom_audio_url text,
  sora_prompt text,
  sora_video_url text,
  voice_url text,
  profile_image_url text,
  error_message text,
  progress integer DEFAULT 0,
  credits_cost decimal DEFAULT 1.0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.actors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for actors
CREATE POLICY "Users can view own actors" 
ON public.actors 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own actors" 
ON public.actors 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own actors" 
ON public.actors 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own actors" 
ON public.actors 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic updated_at
CREATE TRIGGER update_actors_updated_at
BEFORE UPDATE ON public.actors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for actors table
ALTER PUBLICATION supabase_realtime ADD TABLE public.actors;