DO $$
DECLARE
    lucas_id uuid;
    caitano_id uuid;
    func_id uuid;
BEGIN
    DELETE FROM auth.users WHERE email IN ('lucas@example.com', 'caitano@example.com', 'funcionario@example.com');
    
    lucas_id := gen_random_uuid();
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, instance_id, confirmation_token, is_sso_user)
    VALUES (lucas_id, 'lucas@example.com', crypt('Lx7!qP92#vK4', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000', '', false);

    caitano_id := gen_random_uuid();
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, instance_id, confirmation_token, is_sso_user)
    VALUES (caitano_id, 'caitano@example.com', crypt('Ct5@Nw83!rZ6', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000', '', false);

    func_id := gen_random_uuid();
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, instance_id, confirmation_token, is_sso_user)
    VALUES (func_id, 'funcionario@example.com', crypt('Fn9#Kb27@xM5', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000', '', false);

    INSERT INTO public.user_roles (user_id, role) VALUES (lucas_id, 'admin'), (caitano_id, 'admin'), (func_id, 'funcionario') ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.user_permissions (user_id, permission)
    SELECT lucas_id, unnest(ARRAY['produtos.manage', 'solicitacoes.manage', 'auditoria.view', 'backup.manage', 'usuarios.manage', 'pedidos.view']) ON CONFLICT DO NOTHING;
    
    INSERT INTO public.user_permissions (user_id, permission)
    SELECT caitano_id, unnest(ARRAY['produtos.manage', 'solicitacoes.manage', 'auditoria.view', 'backup.manage', 'usuarios.manage', 'pedidos.view']) ON CONFLICT DO NOTHING;
    
    INSERT INTO public.user_permissions (user_id, permission)
    SELECT func_id, unnest(ARRAY['produtos.manage', 'pedidos.view', 'solicitacoes.manage']) ON CONFLICT DO NOTHING;
END $$;
