
-- 1. Ensure has_role function exists and is SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- 2. Audit 'produtos' table RLS
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active products" ON public.produtos;
DROP POLICY IF EXISTS "Staff can manage products" ON public.produtos;

CREATE POLICY "Public can view active products"
ON public.produtos FOR SELECT
TO anon, authenticated
USING (ativo = true OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'funcionario'));

CREATE POLICY "Staff can manage products"
ON public.produtos FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'funcionario'));

-- 3. Audit 'categorias' table RLS
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view categories" ON public.categorias;
DROP POLICY IF EXISTS "Staff can manage categories" ON public.categorias;

CREATE POLICY "Public can view categories"
ON public.categorias FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Staff can manage categories"
ON public.categorias FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'funcionario'));

-- 4. Audit 'hero_slides' table RLS
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view hero slides" ON public.hero_slides;
DROP POLICY IF EXISTS "Staff can manage hero slides" ON public.hero_slides;

CREATE POLICY "Public can view hero slides"
ON public.hero_slides FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Staff can manage hero slides"
ON public.hero_slides FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'funcionario'));

-- 5. Audit 'site_config' table RLS
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view site config" ON public.site_config;
DROP POLICY IF EXISTS "Staff can manage site config" ON public.site_config;

CREATE POLICY "Public can view site config"
ON public.site_config FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Staff can manage site config"
ON public.site_config FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'funcionario'));

-- 6. Audit Storage Buckets RLS (storage schema)
DROP POLICY IF EXISTS "Authenticated read product images" ON storage.objects;
DROP POLICY IF EXISTS "Staff upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Staff update product images" ON storage.objects;
DROP POLICY IF EXISTS "Staff delete product images" ON storage.objects;

CREATE POLICY "Authenticated read product images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Staff upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'funcionario')));

CREATE POLICY "Staff update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'funcionario')));

CREATE POLICY "Staff delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'funcionario')));
