-- Policies for 'atendentes-v1-private'
CREATE POLICY "Public Read v1 private"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'atendentes-v1-private');

CREATE POLICY "Authenticated Upload v1 private"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'atendentes-v1-private');

CREATE POLICY "Authenticated Update v1 private"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'atendentes-v1-private');

CREATE POLICY "Authenticated Delete v1 private"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'atendentes-v1-private');
