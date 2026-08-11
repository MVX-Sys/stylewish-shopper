
-- Reset passwords and force confirmation via the base columns
UPDATE auth.users 
SET 
  encrypted_password = crypt('Lx7!qP92#vK4', gen_salt('bf')),
  email_confirmed_at = now(),
  last_sign_in_at = NULL,
  raw_app_meta_data = raw_app_meta_data || '{"provider":"email","providers":["email"]}'::jsonb
WHERE email = 'lucas@example.com';

UPDATE auth.users 
SET 
  encrypted_password = crypt('Ct5@Nw83!rZ6', gen_salt('bf')),
  email_confirmed_at = now(),
  last_sign_in_at = NULL,
  raw_app_meta_data = raw_app_meta_data || '{"provider":"email","providers":["email"]}'::jsonb
WHERE email = 'caitano@example.com';

UPDATE auth.users 
SET 
  encrypted_password = crypt('Fn9#Kb27@xM5', gen_salt('bf')),
  email_confirmed_at = now(),
  last_sign_in_at = NULL,
  raw_app_meta_data = raw_app_meta_data || '{"provider":"email","providers":["email"]}'::jsonb
WHERE email = 'funcionario@example.com';

-- Ensure user_roles are correctly set up for these specific emails
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email IN ('lucas@example.com', 'caitano@example.com')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'funcionario' FROM auth.users WHERE email = 'funcionario@example.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Grant usage on auth schema for authenticator just in case
GRANT USAGE ON SCHEMA auth TO authenticator;
GRANT SELECT ON auth.users TO authenticator;
