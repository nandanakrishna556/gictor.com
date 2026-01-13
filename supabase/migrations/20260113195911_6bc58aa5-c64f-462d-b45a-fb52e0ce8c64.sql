-- Fix 1: Restrict credit_transactions INSERT policy to only allow usage transactions with negative amounts
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.credit_transactions;

CREATE POLICY "Users can log usage only"
  ON public.credit_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND transaction_type = 'usage'
    AND amount < 0
  );

-- Fix 2: Make uploads bucket private and update storage policies
UPDATE storage.buckets SET public = false WHERE id = 'uploads';

-- Remove the overly permissive public read policy
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;

-- Create owner-only read policy for authenticated users
CREATE POLICY "Users can read own files" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Ensure users can still upload and manage their own files
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
CREATE POLICY "Users can upload own files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;
CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Allow authenticated update" ON storage.objects;
CREATE POLICY "Users can update own files" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'uploads' AND (storage.foldername(name))[1] = auth.uid()::text);