DO $$
DECLARE
    lucas_id uuid := gen_random_uuid();
    caitano_id uuid := gen_random_uuid();
    func_id uuid := gen_random_uuid();
BEGIN
    -- Provision Lucas
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'lucas@example.com') THEN
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, is_super_admin)
        VALUES (
            lucas_id, 
            'lucas@example.com', 
            crypt('admin123', gen_salt('bf')), 
            now(), 
            '{"provider":"email","providers":["email"]}', 
            '{"full_name":"Lucas Admin"}', 
            now(), 
            now(), 
            'authenticated', 
            '', 
            false
        );
        INSERT INTO public.user_roles (user_id, role) VALUES (lucas_id, 'admin');
    ELSE
        SELECT id INTO lucas_id FROM auth.users WHERE email = 'lucas@example.com';
        INSERT INTO public.user_roles (user_id, role) VALUES (lucas_id, 'admin') ON CONFLICT DO NOTHING;
    END IF;

    -- Provision Caitano
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'caitano@example.com') THEN
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, is_super_admin)
        VALUES (
            caitano_id, 
            'caitano@example.com', 
            crypt('admin123', gen_salt('bf')), 
            now(), 
            '{"provider":"email","providers":["email"]}', 
            '{"full_name":"Caitano Admin"}', 
            now(), 
            now(), 
            'authenticated', 
            '', 
            false
        );
        INSERT INTO public.user_roles (user_id, role) VALUES (caitano_id, 'admin');
    ELSE
        SELECT id INTO caitano_id FROM auth.users WHERE email = 'caitano@example.com';
        INSERT INTO public.user_roles (user_id, role) VALUES (caitano_id, 'admin') ON CONFLICT DO NOTHING;
    END IF;

    -- Provision Funcionario
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'funcionario@example.com') THEN
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, is_super_admin)
        VALUES (
            func_id, 
            'funcionario@example.com', 
            crypt('func123', gen_salt('bf')), 
            now(), 
            '{"provider":"email","providers":["email"]}', 
            '{"full_name":"Funcionario"}', 
            now(), 
            now(), 
            'authenticated', 
            '', 
            false
        );
        INSERT INTO public.user_roles (user_id, role) VALUES (func_id, 'funcionario');
    ELSE
        SELECT id INTO func_id FROM auth.users WHERE email = 'funcionario@example.com';
        INSERT INTO public.user_roles (user_id, role) VALUES (func_id, 'funcionario') ON CONFLICT DO NOTHING;
    END IF;
END $$;