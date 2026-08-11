DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.has_permission(uuid, text);
DROP FUNCTION IF EXISTS public.check_user_role_simple(uuid, text);

GRANT USAGE ON SCHEMA public TO anon, authenticated, authenticator;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, authenticator;

DELETE FROM auth.users WHERE email IN ('lucas@example.com', 'caitano@example.com', 'funcionario@example.com');

INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at, 
    raw_app_meta_data, raw_user_meta_data, aud, role, 
    instance_id, confirmation_token, is_sso_user
)
VALUES 
(gen_random_uuid(), 'lucas@example.com', crypt('Lx7!qP92#vK4', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000', '', false),
(gen_random_uuid(), 'caitano@example.com', crypt('Ct5@Nw83!rZ6', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000', '', false),
(gen_random_uuid(), 'funcionario@example.com', crypt('Fn9#Kb27@xM5', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000', '', false);

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email IN ('lucas@example.com', 'caitano@example.com');

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'funcionario' FROM auth.users WHERE email = 'funcionario@example.com';

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

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, authenticator, service_role;

-- Re-add permission check if needed by app
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

GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO anon, authenticated, authenticator, service_role;
