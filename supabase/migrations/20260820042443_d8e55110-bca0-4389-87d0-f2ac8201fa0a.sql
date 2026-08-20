-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cupons TO authenticated;
GRANT ALL ON public.cupons TO service_role;
GRANT SELECT ON public.cupons TO anon;

-- Ensure RLS is enabled
ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins and staff can manage coupons" ON public.cupons;
DROP POLICY IF EXISTS "Public can read coupons" ON public.cupons;

-- Create management policy for staff and admins
CREATE POLICY "Admins and staff can manage coupons"
ON public.cupons
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'funcionario')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'funcionario')
);

-- Create read-only policy for everyone
CREATE POLICY "Public can read coupons"
ON public.cupons
FOR SELECT
TO public
USING (ativo = true);