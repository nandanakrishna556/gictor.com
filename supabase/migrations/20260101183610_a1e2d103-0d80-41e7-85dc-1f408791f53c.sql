-- Add missing columns to actors table
ALTER TABLE public.actors ADD COLUMN IF NOT EXISTS mode text;
ALTER TABLE public.actors ADD COLUMN IF NOT EXISTS language text;
ALTER TABLE public.actors ADD COLUMN IF NOT EXISTS dialect text;
ALTER TABLE public.actors ADD COLUMN IF NOT EXISTS other_instructions text;

-- Change age from text to integer if needed (drop and recreate)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'actors' 
    AND column_name = 'age' 
    AND data_type = 'text'
  ) THEN
    ALTER TABLE public.actors DROP COLUMN age;
    ALTER TABLE public.actors ADD COLUMN age integer;
  END IF;
END $$;