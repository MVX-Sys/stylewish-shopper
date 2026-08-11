
-- Drop the trigger on auth.users temporarily to see if it's the culprit
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Re-create the trigger function in auth schema if possible, or just simplify it
-- Actually, let's just drop it and see if login works.
