-- Políticas de Storage para atendentes-v1-private
-- 1. Leitura pública (mesmo sendo private bucket, objetos individuais podem ser expostos via RLS se quisermos, 
-- mas aqui vamos garantir que autenticados e anon possam VER)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Public Access to atendentes-v1-private'
    ) THEN
        CREATE POLICY "Public Access to atendentes-v1-private"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'atendentes-v1-private');
    END IF;
END $$;

-- 2. Inserção por usuários autenticados
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Authenticated Upload to atendentes-v1-private'
    ) THEN
        CREATE POLICY "Authenticated Upload to atendentes-v1-private"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'atendentes-v1-private');
    END IF;
END $$;

-- 3. Update/Delete por usuários autenticados
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Authenticated Update/Delete on atendentes-v1-private'
    ) THEN
        CREATE POLICY "Authenticated Update/Delete on atendentes-v1-private"
        ON storage.objects FOR ALL
        TO authenticated
        USING (bucket_id = 'atendentes-v1-private');
    END IF;
END $$;
