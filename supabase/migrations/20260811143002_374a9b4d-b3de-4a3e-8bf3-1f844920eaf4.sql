
-- 1. Correct function updates (using exact names found: _user_id, _perm, _role)
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _perm text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = _user_id AND permission = _perm
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- 2. Broad permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, authenticator;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, authenticator;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated, authenticator;
GRANT USAGE ON TYPE public.app_role TO anon, authenticated, authenticator;
GRANT SELECT ON public.user_roles TO authenticator;
GRANT SELECT ON public.user_permissions TO authenticator;

-- 3. Temporarily disable RLS
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions DISABLE ROW LEVEL SECURITY;

-- 4. Reset passwords ONLY (don't touch generated columns)
UPDATE auth.users SET encrypted_password = crypt('Lx7!qP92#vK4', gen_salt('bf')) WHERE email = 'lucas@example.com';
UPDATE auth.users SET encrypted_password = crypt('Ct5@Nw83!rZ6', gen_salt('bf')) WHERE email = 'caitano@example.com';
UPDATE auth.users SET encrypted_password = crypt('Fn9#Kb27@xM5', gen_salt('bf')) WHERE email = 'funcionario@example.com';
