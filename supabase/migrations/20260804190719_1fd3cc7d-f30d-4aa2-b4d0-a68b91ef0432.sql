-- Explicitly revoke from PUBLIC, anon and authenticated to be sure
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM PUBLIC, anon, authenticated;

-- Grant only to necessary roles
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO service_role;

-- If your app logic requires authenticated users to call these directly (rare for security checks used in RLS), 
-- you would grant to authenticated, but the linter warns because they are SECURITY DEFINER.
-- Since they are used in RLS policies, the system/owner executes them, so service_role/owner is usually enough 
-- for the RLS context to work if the function is owned by a high-privilege user.
