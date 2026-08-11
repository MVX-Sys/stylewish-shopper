-- 1. Limpar as tabelas dependentes primeiro
DELETE FROM public.user_roles;

-- 2. Limpar a tabela auth.users
DELETE FROM auth.users;

-- 3. Criar o usuário administrador e atribuir o papel em um bloco anônimo
DO $$
DECLARE
  new_admin_id uuid := gen_random_uuid();
BEGIN
  -- Inserir no auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud,
    confirmation_token
  )
  VALUES (
    new_admin_id,
    '00000000-0000-0000-0000-000000000000',
    'mvxsistemas@hotmail.com',
    crypt('mateus0209', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated',
    'authenticated',
    ''
  );

  -- Inserir no public.user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new_admin_id, 'admin');
END $$;
