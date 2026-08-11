-- Attempt to create users in auth.users
-- Password hash for 'Lx7!qP92#vK4' (just a placeholder, we'll try to use a trigger or admin helper if possible)
-- However, direct insert into auth.users is often restricted.
-- Let's try to use the dedicated function if it exists, or just do the public side first and tell the user.

-- Actually, many Supabase projects have a helper for this.
-- Let's try to do it safely.

INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT 
    gen_random_uuid(), 
    '00000000-0000-0000-0000-000000000000', 
    'lucas@example.com', 
    crypt('Lx7!qP92#vK4', gen_salt('bf')), 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{}', 
    now(), 
    now(), 
    '', '', '', ''
ON CONFLICT (email) DO NOTHING;

INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT 
    gen_random_uuid(), 
    '00000000-0000-0000-0000-000000000000', 
    'caitano@example.com', 
    crypt('Ct5@Nw83!rZ6', gen_salt('bf')), 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{}', 
    now(), 
    now(), 
    '', '', '', ''
ON CONFLICT (email) DO NOTHING;

INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT 
    gen_random_uuid(), 
    '00000000-0000-0000-0000-000000000000', 
    'funcionario@example.com', 
    crypt('Fn9#Kb27@xM5', gen_salt('bf')), 
    now(), 
    '{"provider":"email","providers":["email"]}', 
    '{}', 
    now(), 
    now(), 
    '', '', '', ''
ON CONFLICT (email) DO NOTHING;

-- Now map the roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'lucas@example.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'caitano@example.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'funcionario' FROM auth.users WHERE email = 'funcionario@example.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Map permissions
INSERT INTO public.user_permissions (user_id, permission)
SELECT id, p FROM auth.users, unnest(ARRAY['produtos.manage', 'solicitacoes.manage', 'auditoria.view', 'backup.manage', 'usuarios.manage', 'pedidos.view']) p 
WHERE email IN ('lucas@example.com', 'caitano@example.com')
ON CONFLICT DO NOTHING;

INSERT INTO public.user_permissions (user_id, permission)
SELECT id, p FROM auth.users, unnest(ARRAY['produtos.manage', 'pedidos.view', 'solicitacoes.manage']) p 
WHERE email = 'funcionario@example.com'
ON CONFLICT DO NOTHING;
