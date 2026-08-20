-- Revoke EXECUTE from PUBLIC on all security definer functions in public schema
-- This covers 'anon' and 'authenticated' unless explicitly granted back.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

-- Re-grant only to necessary roles
-- has_role, has_permission, and is_staff are needed for RLS (authenticated users)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;

-- admin_list_users is for the admin panel (authenticated users)
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated, service_role;

-- handle_new_user_roles is a trigger (usually service_role)
GRANT EXECUTE ON FUNCTION public.handle_new_user_roles() TO service_role;

-- test_trigger_fn - restrict to service_role unless needed elsewhere
GRANT EXECUTE ON FUNCTION public.test_trigger_fn() TO service_role;

-- Re-grant default execute for non-security-definer functions if needed,
-- but the linter specifically targets SECURITY DEFINER.
-- To be safe and minimal, we just granted what's needed for the app to function.