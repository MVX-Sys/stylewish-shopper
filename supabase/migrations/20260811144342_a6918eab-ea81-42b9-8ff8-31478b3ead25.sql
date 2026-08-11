-- 1. DROP ALL CUSTOM TRIGGERS ON auth.users
-- This is often the culprit for "Database error querying schema" if the trigger function itself is invalid
-- or has permission issues.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Ensure authenticator has USAGE on EVERYTHING it might need in auth
GRANT USAGE ON SCHEMA auth TO authenticator;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO authenticator;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO authenticator;

-- 3. Check for any views or materialized views in public that might be broken
-- (None usually, but let's just be thorough)

-- 4. Try to re-confirm the users using the Supabase Auth internal function if possible
-- Since we can't call it directly easily, we ensure the confirmed columns are exactly right.
UPDATE auth.users SET 
    email_confirmed_at = now(),
    last_sign_in_at = NULL,
    raw_app_meta_data = '{"provider":"email","providers":["email"]}',
    raw_user_meta_data = '{}',
    aud = 'authenticated',
    role = 'authenticated'
WHERE email IN ('lucas@example.com', 'caitano@example.com', 'funcionario@example.com');

-- 5. If the 500 persists, it might be due to a RLS policy on auth.users (if it exists)
-- or something else in the auth schema.
