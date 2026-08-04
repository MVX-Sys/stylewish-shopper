-- Re-grant execute permissions to authenticated users
-- While the linter warns about SECURITY DEFINER functions being executable by users,
-- these specific functions are necessary for RLS policies and server-side checks
-- that run in the context of the authenticated user.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated;

-- Keep public (anon) access revoked as a safety measure unless explicitly needed
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM anon;
