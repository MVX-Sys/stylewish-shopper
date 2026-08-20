-- Drop and recreate has_permission to ensure parameter name consistency
DROP FUNCTION IF EXISTS public.has_permission(uuid, text);

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    from public.user_roles ur
    where ur.user_id = _user_id
      and ur.role = 'admin'
  ) OR EXISTS (
    SELECT 1
    FROM public.user_permissions
    WHERE user_id = _user_id
      AND permission = _permission
  )
$$;

GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated, anon;

-- Setup cupons table RLS
ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Public can read coupons" ON public.cupons;
DROP POLICY IF EXISTS "Managers can insert coupons" ON public.cupons;
DROP POLICY IF EXISTS "Managers can update coupons" ON public.cupons;
DROP POLICY IF EXISTS "Managers can delete coupons" ON public.cupons;

-- Public can read active coupons (needed for checkout validation)
CREATE POLICY "Public can read coupons"
ON public.cupons
FOR SELECT
TO authenticated, anon
USING (true);

-- Admin and Staff with cupons.manage can insert
CREATE POLICY "Managers can insert coupons"
ON public.cupons
FOR INSERT
TO authenticated
WITH CHECK (public.has_permission(auth.uid(), 'cupons.manage'));

-- Admin and Staff with cupons.manage can update
CREATE POLICY "Managers can update coupons"
ON public.cupons
FOR UPDATE
TO authenticated
USING (public.has_permission(auth.uid(), 'cupons.manage'))
WITH CHECK (public.has_permission(auth.uid(), 'cupons.manage'));

-- Admin and Staff with cupons.manage can delete
CREATE POLICY "Managers can delete coupons"
ON public.cupons
FOR DELETE
TO authenticated
USING (public.has_permission(auth.uid(), 'cupons.manage'));

-- Ensure grants are correct
GRANT ALL ON public.cupons TO authenticated;
GRANT ALL ON public.cupons TO service_role;
GRANT SELECT ON public.cupons TO anon;
