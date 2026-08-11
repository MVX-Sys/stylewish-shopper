DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
  user_email TEXT := 'achaebuscaadmintotal5890@example.com'; 
  hashed_password TEXT := crypt('E^q$DfurwXpq64qfy8GyQB', gen_salt('bf'));
BEGIN
  -- 1. Create the user in auth.users if they don't exist
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      aud,
      role,
      is_sso_user
    )
    VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      user_email,
      hashed_password,
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Admin Total"}',
      now(),
      now(),
      'authenticated',
      'authenticated',
      false
    );
  ELSE
    SELECT id INTO new_user_id FROM auth.users WHERE email = user_email;
  END IF;

  -- 2. Assign the admin role in public.user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 3. Assign all permissions in public.user_permissions
  -- First ensure the table exists (it should based on previous context)
  INSERT INTO public.user_permissions (user_id, permission)
  VALUES 
    (new_user_id, 'produtos.manage'),
    (new_user_id, 'solicitacoes.manage'),
    (new_user_id, 'auditoria.view'),
    (new_user_id, 'backup.manage'),
    (new_user_id, 'usuarios.manage'),
    (new_user_id, 'pedidos.view')
  ON CONFLICT DO NOTHING;

END $$;