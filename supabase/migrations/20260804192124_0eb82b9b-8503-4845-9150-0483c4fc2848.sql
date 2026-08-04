-- Remover políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Atendentes Public View" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;

-- Criar política de visualização pública (usando a tabela storage.objects que é permitida)
CREATE POLICY "Atendentes Public View"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'atendentes-v1-private');

-- Criar política de upload para usuários autenticados
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'atendentes-v1-private');

-- Garantir privilégios básicos (Supabase gerencia privilégios no esquema storage, 
-- mas reforçamos o acesso via API)
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;
