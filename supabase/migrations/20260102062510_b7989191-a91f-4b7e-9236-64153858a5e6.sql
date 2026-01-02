-- Remove dialect column from actors table
ALTER TABLE public.actors DROP COLUMN IF EXISTS dialect;