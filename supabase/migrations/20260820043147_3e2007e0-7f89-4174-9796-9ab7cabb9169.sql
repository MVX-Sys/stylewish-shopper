-- 1. Fix missing search_path
ALTER FUNCTION public.test_trigger_fn() SET search_path = public;

-- 2. Revoke public execute from security definer functions
-- Revoking from public includes anon and authenticated
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM public;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_roles() FROM public;
REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM public;
REVOKE EXECUTE ON FUNCTION public.test_trigger_fn() FROM public;

-- 3. Re-grant only to necessary roles (usually service_role for system triggers/RPCS or specific ones)
-- has_role and has_permission are used in RLS, so authenticated needs them
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated, service_role;

-- handle_new_user_roles is likely a trigger on auth.users, so it needs to be callable by system roles
GRANT EXECUTE ON FUNCTION public.handle_new_user_roles() TO service_role;