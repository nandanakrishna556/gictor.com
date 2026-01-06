-- Create uploads storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);

-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- Allow public read access
CREATE POLICY "Allow public read" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'uploads');

-- Allow users to update their own uploads
CREATE POLICY "Allow users to update own uploads" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own uploads
CREATE POLICY "Allow users to delete own uploads" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'uploads' AND (storage.foldername(name))[1] = auth.uid()::text);