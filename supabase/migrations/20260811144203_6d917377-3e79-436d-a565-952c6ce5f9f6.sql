-- The linter often triggers these 500s if the authenticator role loses access to schema info
GRANT USAGE ON SCHEMA public TO anon, authenticated, authenticator;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, authenticator;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticator;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO authenticator;

-- Explicitly check if the authenticator can execute the role functions
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticator;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticator;

-- If the 500 is "Database error querying schema", it might be looking for something in public it can't see
-- or it's failing to resolve the custom enum in the function signature during schema introspection.
-- Try moving the security checks to a more basic version that doesn't use the enum in the signature for authenticator
CREATE OR REPLACE FUNCTION public.check_user_role_simple(_user_id uuid, _role_text text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role::text = _role_text
  );
$$;

GRANT EXECUTE ON FUNCTION public.check_user_role_simple(uuid, text) TO anon, authenticated, authenticator, service_role;
