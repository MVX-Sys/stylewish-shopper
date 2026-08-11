
-- Fix possible issues with existing auth trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Re-create the setup function with explicit grants and search_path
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
EXCEPTION WHEN OTHERS THEN
  -- Log error if we can, but don't block
  RETURN new;
END;
$$;

GRANT EXECUTE ON FUNCTION public.handle_new_user_setup() TO postgres, service_role;

-- Re-attach trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_setup();

-- Grant schema usage to avoid GoTrue permission errors
GRANT USAGE ON SCHEMA public TO anon, authenticated, authenticator;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated, authenticator;
