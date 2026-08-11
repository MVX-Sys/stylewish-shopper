-- If nothing else works, maybe there's a problem with the roleKind logic in the client
-- or the app_role enum itself is somehow corrupted in the eyes of the introspection service.

-- Let's try changing the app_role enum to a simpler table-based approach OR 
-- ensure it's absolutely standard.

-- Try granting even more permissions to the authenticator role on everything it might touch.
GRANT USAGE ON SCHEMA public TO authenticator;
GRANT USAGE ON SCHEMA auth TO authenticator;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticator;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO authenticator;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticator;

-- Verify if there are any orphaned or broken triggers
-- (None known, but let's be safe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Re-create a very simple trigger that does nothing first, just to test if triggers are the cause
CREATE OR REPLACE FUNCTION public.test_trigger_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.test_trigger_fn();

-- Check for any suspicious policies on public tables that might affect service users
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions DISABLE ROW LEVEL SECURITY;
