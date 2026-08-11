-- CLEAN UP AND RESTORE
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'funcionario', 'user');
    END IF;
END $$;

ALTER TABLE public.user_roles ALTER COLUMN role TYPE public.app_role USING role::public.app_role;

GRANT USAGE ON SCHEMA public TO anon, authenticated, authenticator, service_role;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, authenticator, service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

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

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

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

GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated, service_role;

-- Update users WITHOUT confirmed_at
UPDATE auth.users SET 
    encrypted_password = crypt('Lx7!qP92#vK4', gen_salt('bf')),
    email_confirmed_at = now(),
    raw_app_meta_data = '{"provider":"email","providers":["email"]}',
    raw_user_meta_data = '{}'
WHERE email = 'lucas@example.com';

UPDATE auth.users SET 
    encrypted_password = crypt('Ct5@Nw83!rZ6', gen_salt('bf')),
    email_confirmed_at = now(),
    raw_app_meta_data = '{"provider":"email","providers":["email"]}',
    raw_user_meta_data = '{}'
WHERE email = 'caitano@example.com';

UPDATE auth.users SET 
    encrypted_password = crypt('Fn9#Kb27@xM5', gen_salt('bf')),
    email_confirmed_at = now(),
    raw_app_meta_data = '{"provider":"email","providers":["email"]}',
    raw_user_meta_data = '{}'
WHERE email = 'funcionario@example.com';
