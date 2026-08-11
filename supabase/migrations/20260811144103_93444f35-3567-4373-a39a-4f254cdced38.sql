DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.has_permission(uuid, text);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'funcionario', 'user');
    END IF;
END $$;

GRANT USAGE ON SCHEMA public TO anon, authenticated, authenticator, service_role;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, authenticator, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated, authenticator;

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

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, authenticator, service_role;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO anon, authenticated, authenticator, service_role;

CREATE OR REPLACE FUNCTION public.handle_new_user_setup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user')
  ON CONFLICT DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_setup();

DELETE FROM auth.users WHERE email IN ('lucas@example.com', 'caitano@example.com', 'funcionario@example.com');

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, instance_id, confirmation_token)
VALUES 
(gen_random_uuid(), 'lucas@example.com', crypt('Lx7!qP92#vK4', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', '00000000-0000-0000-0000-000000000000', ''),
(gen_random_uuid(), 'caitano@example.com', crypt('Ct5@Nw83!rZ6', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', '00000000-0000-0000-0000-000000000000', ''),
(gen_random_uuid(), 'funcionario@example.com', crypt('Fn9#Kb27@xM5', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', '00000000-0000-0000-0000-000000000000', '');

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email IN ('lucas@example.com', 'caitano@example.com');

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'funcionario' FROM auth.users WHERE email = 'funcionario@example.com';

INSERT INTO public.user_permissions (user_id, permission)
SELECT u.id, p.key
FROM auth.users u, (
    SELECT unnest(ARRAY['produtos.manage', 'solicitacoes.manage', 'auditoria.view', 'backup.manage', 'usuarios.manage', 'pedidos.view']) as key
) p
WHERE u.email IN ('lucas@example.com', 'caitano@example.com');

INSERT INTO public.user_permissions (user_id, permission)
SELECT u.id, p.key
FROM auth.users u, (
    SELECT unnest(ARRAY['produtos.manage', 'pedidos.view', 'solicitacoes.manage']) as key
) p
WHERE u.email = 'funcionario@example.com';
