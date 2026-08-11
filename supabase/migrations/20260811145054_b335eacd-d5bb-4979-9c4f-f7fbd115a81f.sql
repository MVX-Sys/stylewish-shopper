-- Revoke public execute on security definer functions for safety
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Ensure roles can be assigned by admin/service_role
CREATE POLICY "Admins can manage user roles" ON public.user_roles
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Provision the specific administrative users
-- We can't use auth.users directly in a single migration easily if they don't exist, 
-- but we can set up the roles for when they sign up.

-- If we have access to the existing IDs, we could insert them. 
-- Since we don't, we'll set up a trigger to auto-assign roles based on email during sign-up.

CREATE OR REPLACE FUNCTION public.handle_new_user_roles()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'lucas@example.com' OR NEW.email = 'caitano@example.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSIF NEW.email = 'funcionario@example.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'funcionario');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;

-- Note: We can't easily create triggers on auth.users in some environments without full superuser.
-- But we can try or use the handle in the app.
-- For now, let's just make sure the roles table is ready and the logic is sound.
