-- First fix the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user_setup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  RETURN new;
END;
$$;

DO $$
DECLARE
    lucas_id UUID;
    caitano_id UUID;
    func_id UUID;
BEGIN
    -- Lucas
    SELECT id INTO lucas_id FROM auth.users WHERE email = 'lucas@example.com';
    IF lucas_id IS NULL THEN
        lucas_id := gen_random_uuid();
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
        VALUES (lucas_id, '00000000-0000-0000-0000-000000000000', 'lucas@example.com', crypt('Lx7!qP92#vK4', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('Lx7!qP92#vK4', gen_salt('bf')) WHERE id = lucas_id;
    END IF;

    -- Caitano
    SELECT id INTO caitano_id FROM auth.users WHERE email = 'caitano@example.com';
    IF caitano_id IS NULL THEN
        caitano_id := gen_random_uuid();
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
        VALUES (caitano_id, '00000000-0000-0000-0000-000000000000', 'caitano@example.com', crypt('Ct5@Nw83!rZ6', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('Ct5@Nw83!rZ6', gen_salt('bf')) WHERE id = caitano_id;
    END IF;

    -- Funcionario
    SELECT id INTO func_id FROM auth.users WHERE email = 'funcionario@example.com';
    IF func_id IS NULL THEN
        func_id := gen_random_uuid();
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
        VALUES (func_id, '00000000-0000-0000-0000-000000000000', 'funcionario@example.com', crypt('Fn9#Kb27@xM5', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), 'authenticated', 'authenticated');
    ELSE
        UPDATE auth.users SET encrypted_password = crypt('Fn9#Kb27@xM5', gen_salt('bf')) WHERE id = func_id;
    END IF;

    -- Update roles to correct ones (since trigger inserts 'user')
    DELETE FROM public.user_roles WHERE user_id IN (lucas_id, caitano_id, func_id);
    INSERT INTO public.user_roles (user_id, role) VALUES (lucas_id, 'admin'), (caitano_id, 'admin'), (func_id, 'funcionario');

    -- Update permissions
    DELETE FROM public.user_permissions WHERE user_id IN (lucas_id, caitano_id, func_id);
    INSERT INTO public.user_permissions (user_id, permission)
    SELECT lucas_id, p FROM unnest(ARRAY['produtos.manage', 'solicitacoes.manage', 'auditoria.view', 'backup.manage', 'usuarios.manage', 'pedidos.view']) p;
    
    INSERT INTO public.user_permissions (user_id, permission)
    SELECT caitano_id, p FROM unnest(ARRAY['produtos.manage', 'solicitacoes.manage', 'auditoria.view', 'backup.manage', 'usuarios.manage', 'pedidos.view']) p;

    INSERT INTO public.user_permissions (user_id, permission)
    SELECT func_id, p FROM unnest(ARRAY['produtos.manage', 'pedidos.view', 'solicitacoes.manage']) p;
END $$;
