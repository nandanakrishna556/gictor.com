-- Change default credits for new users from 10 to 0
ALTER TABLE public.profiles ALTER COLUMN credits SET DEFAULT 0;