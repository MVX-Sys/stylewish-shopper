DROP POLICY IF EXISTS "Public Access to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Acesso Publico Imagens 2026" ON storage.objects;
DROP POLICY IF EXISTS "Upload Imagens Admin 2026" ON storage.objects;
DROP POLICY IF EXISTS "Update Imagens Admin 2026" ON storage.objects;
DROP POLICY IF EXISTS "Delete Imagens Admin 2026" ON storage.objects;

CREATE POLICY "Acesso Publico Imagens 2026" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Upload Imagens Admin 2026" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Update Imagens Admin 2026" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Delete Imagens Admin 2026" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'product-images');
