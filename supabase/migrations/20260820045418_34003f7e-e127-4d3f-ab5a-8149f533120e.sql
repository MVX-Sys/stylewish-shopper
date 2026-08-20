DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role') THEN
    GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_staff') THEN
    GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'admin_list_users') THEN
    GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated, anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'decrement_stock') THEN
    GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) TO authenticated, anon;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO authenticated, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated, anon;