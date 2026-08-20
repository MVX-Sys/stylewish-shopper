
CREATE POLICY "Public Access to product-images" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'product-images');
