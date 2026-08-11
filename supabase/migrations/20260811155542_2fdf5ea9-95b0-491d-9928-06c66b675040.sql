CREATE POLICY "Admins can view all permissions"
ON public.user_permissions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));