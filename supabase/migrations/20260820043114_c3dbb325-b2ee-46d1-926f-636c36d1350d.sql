-- 1. Ensure the has_role function is robust and handles nulls
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

-- 2. Revoke and Grant privileges to be sure
REVOKE ALL ON public.cupons FROM authenticated, anon, public;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cupons TO authenticated;
GRANT ALL ON public.cupons TO service_role;
GRANT SELECT ON public.cupons TO anon;

-- 3. Re-create policies with explicit authenticated check
DROP POLICY IF EXISTS "Admins and staff can manage coupons" ON public.cupons;
DROP POLICY IF EXISTS "Public can read coupons" ON public.cupons;

-- Management policy: Only Admin or Funcionario can perform write operations
CREATE POLICY "Admins and staff can manage coupons"
ON public.cupons
FOR ALL
TO authenticated
USING (
  (SELECT public.has_role(auth.uid(), 'admin')) OR 
  (SELECT public.has_role(auth.uid(), 'funcionario'))
)
WITH CHECK (
  (SELECT public.has_role(auth.uid(), 'admin')) OR 
  (SELECT public.has_role(auth.uid(), 'funcionario'))
);

-- Read policy: Everyone can see active coupons, but staff can see all
CREATE POLICY "Public can read coupons"
ON public.cupons
FOR SELECT
TO public
USING (
  ativo = true OR 
  (auth.uid() IS NOT NULL AND (
    (SELECT public.has_role(auth.uid(), 'admin')) OR 
    (SELECT public.has_role(auth.uid(), 'funcionario'))
  ))
);