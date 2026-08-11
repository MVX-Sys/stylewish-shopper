-- Fix WARN 1: Function Search Path Mutable
-- Fix WARN 2, 3, 4, 5: Revoke public/authenticated execution from SECURITY DEFINER functions

-- 1. has_role function
ALTER FUNCTION public.has_role(uuid, public.app_role) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

-- 2. has_permission function (assuming it exists based on previous logs)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_permission') THEN
        EXECUTE 'ALTER FUNCTION public.has_permission(uuid, text) SET search_path = public';
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM PUBLIC';
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM authenticated';
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO service_role';
    END IF;
END $$;

-- 3. handle_new_user_setup function
ALTER FUNCTION public.handle_new_user_setup() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_setup() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_setup() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user_setup() TO service_role;
