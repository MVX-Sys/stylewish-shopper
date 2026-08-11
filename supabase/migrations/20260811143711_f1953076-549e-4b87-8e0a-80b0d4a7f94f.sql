-- 1. Reparar os metadados dos usuários (sem tocar em colunas geradas)
UPDATE auth.users 
SET 
  instance_id = '00000000-0000-0000-0000-000000000000',
  aud = 'authenticated',
  role = 'authenticated',
  email_confirmed_at = now(),
  last_sign_in_at = NULL,
  raw_app_meta_data = '{"provider":"email","providers":["email"]}',
  raw_user_meta_data = '{}',
  updated_at = now()
WHERE email IN ('lucas@example.com', 'caitano@example.com', 'funcionario@example.com');

-- 2. Garantir permissões de schema
GRANT USAGE ON SCHEMA auth TO authenticator;
GRANT SELECT ON auth.users TO authenticator;
GRANT USAGE ON SCHEMA public TO authenticator;
GRANT USAGE ON TYPE public.app_role TO authenticator;
GRANT SELECT ON public.user_roles TO authenticator;
GRANT SELECT ON public.user_permissions TO authenticator;

-- 3. Sincronizar roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email IN ('lucas@example.com', 'caitano@example.com')
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'funcionario' FROM auth.users WHERE email = 'funcionario@example.com'
ON CONFLICT DO NOTHING;
