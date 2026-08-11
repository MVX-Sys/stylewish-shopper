-- Procedimento de reparo total do sistema de autenticação e permissões

-- 1. Remover TODA a lógica de segurança anterior que possa estar causando recursão ou erro de schema
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_setup() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role) CASCADE;
DROP FUNCTION IF EXISTS public.has_permission(uuid, text) CASCADE;

-- 2. Garantir que o tipo enum existe
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'funcionario', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Criar funções de segurança ULTRA-SIMPLES e robustas
-- Usando SECURITY DEFINER e SET search_path para evitar ataques de busca e erros de contexto
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role_to_check public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role_to_check
  );
$$;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _perm_to_check text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = _user_id AND permission = _perm_to_check
  );
$$;

-- 4. Função de setup de novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user_setup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user')
  ON CONFLICT DO NOTHING;
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_setup();

-- 5. REPARAR PERMISSÕES DE SCHEMA (Causa provável do erro 500)
-- O Supabase Auth (GoTrue) precisa acessar o schema public e seus tipos
GRANT USAGE ON SCHEMA public TO anon, authenticated, authenticator, service_role;
GRANT USAGE ON TYPE public.app_role TO anon, authenticated, authenticator, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON public.user_roles TO anon, authenticated, authenticator;
GRANT SELECT ON public.user_permissions TO anon, authenticated, authenticator;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, authenticator;

-- 6. RESET DE USUÁRIOS (Garantir que os IDs coincidem e as senhas são válidas)
-- Deletar se existirem para recriar de forma limpa
DELETE FROM auth.users WHERE email IN ('lucas@example.com', 'caitano@example.com', 'funcionario@example.com');

-- Inserir usuários com criptografia Blowfish (padrão Supabase/Postgres)
-- Lucas (Admin)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES (
  gen_random_uuid(), 'lucas@example.com', 
  crypt('Lx7!qP92#vK4', gen_salt('bf')), 
  now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'
) RETURNING id;

-- Caitano (Admin)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES (
  gen_random_uuid(), 'caitano@example.com', 
  crypt('Ct5@Nw83!rZ6', gen_salt('bf')), 
  now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'
) RETURNING id;

-- Funcionario
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES (
  gen_random_uuid(), 'funcionario@example.com', 
  crypt('Fn9#Kb27@xM5', gen_salt('bf')), 
  now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated'
) RETURNING id;

-- Atribuir roles (user_roles usa user_id)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email IN ('lucas@example.com', 'caitano@example.com');

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'funcionario' FROM auth.users WHERE email = 'funcionario@example.com';

-- Atribuir permissões totais para os admins
INSERT INTO public.user_permissions (user_id, permission)
SELECT id, p FROM auth.users u, unnest(ARRAY['products', 'orders', 'users', 'backup', 'audit', 'settings']) p 
WHERE u.email IN ('lucas@example.com', 'caitano@example.com');

-- Permissões para o funcionário
INSERT INTO public.user_permissions (user_id, permission)
SELECT id, p FROM auth.users u, unnest(ARRAY['products', 'orders', 'restock']) p 
WHERE u.email = 'funcionario@example.com';

-- 7. DESATIVAR RLS TEMPORARIAMENTE para teste final
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions DISABLE ROW LEVEL SECURITY;
