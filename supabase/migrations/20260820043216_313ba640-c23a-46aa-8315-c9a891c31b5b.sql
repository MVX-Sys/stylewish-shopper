-- 1. Explicitly revoke from anon and authenticated to satisfy linter
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_roles() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.test_trigger_fn() FROM anon, authenticated, public;

-- 2. Grant back only what is strictly necessary for the app
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user_roles() TO service_role;
GRANT EXECUTE ON FUNCTION public.test_trigger_fn() TO service_role;