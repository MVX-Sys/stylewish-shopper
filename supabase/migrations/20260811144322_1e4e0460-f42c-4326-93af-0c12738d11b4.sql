-- FINAL ATTEMPT AT RESTORING INFRASTRUCTURE
-- If authenticator is failing to query schema, it might be due to a corrupted or unreachable custom type
-- that is referenced in a function signature or table column.

-- 1. DROP EVERYTHING THAT USES THE CUSTOM ENUM
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.handle_new_user_setup();

-- 2. ALTER user_roles TABLE TO NOT USE THE ENUM
ALTER TABLE public.user_roles ALTER COLUMN role TYPE text;

-- 3. DROP THE ENUM
DROP TYPE IF EXISTS public.app_role;

-- 4. RE-ESTABLISH Basic role check function using TEXT only (avoiding custom types in signatures)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
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

GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO anon, authenticated, authenticator, service_role;

-- 5. RE-CREATE USERS ONE MORE TIME
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

-- 6. Restore RLS but with simple policies
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select for self" ON public.user_roles;
CREATE POLICY "Allow select for self" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
GRANT SELECT ON public.user_roles TO authenticated, authenticator;
