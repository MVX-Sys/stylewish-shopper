
DROP POLICY IF EXISTS "Authenticated Delete v1 private" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload to atendentes-v1-private" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update/Delete on atendentes-v1-private" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload v1 private" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update v1 private" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Access v1" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update Access v1" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Access v1" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to atendentes-v1-private" ON storage.objects;
DROP POLICY IF EXISTS "Public Read v1 private" ON storage.objects;

CREATE POLICY "staff manage atendentes buckets"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id IN ('atendentes','atendentes-v1','atendentes-v1-private') AND public.is_staff(auth.uid()))
WITH CHECK (bucket_id IN ('atendentes','atendentes-v1','atendentes-v1-private') AND public.is_staff(auth.uid()));
