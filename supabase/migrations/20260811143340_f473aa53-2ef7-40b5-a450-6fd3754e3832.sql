
-- Just reset functions and try to fix permissions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _perm text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = _user_id AND permission = _perm
  );
END;
$$;

GRANT USAGE ON SCHEMA public TO anon, authenticated, authenticator;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role, authenticator;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated, service_role, authenticator;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role, authenticator;
GRANT USAGE ON TYPE public.app_role TO authenticated, service_role, authenticator;

-- Explicitly revoke from anon and PUBLIC to satisfy security rules while keeping access for roles
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role, authenticator;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated, service_role, authenticator;
