-- Add policies for the new bucket atendentes-v1
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public Read Access v1" ON storage.objects;
    CREATE POLICY "Public Read Access v1"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'atendentes-v1');
END $$;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Authenticated Upload Access v1" ON storage.objects;
    CREATE POLICY "Authenticated Upload Access v1"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'atendentes-v1');
END $$;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Authenticated Update Access v1" ON storage.objects;
    CREATE POLICY "Authenticated Update Access v1"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'atendentes-v1');
END $$;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Authenticated Delete Access v1" ON storage.objects;
    CREATE POLICY "Authenticated Delete Access v1"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'atendentes-v1');
END $$;
