-- Revoke execute from authenticated for functions used in RLS
-- RLS policies can still use them because they are executed by the DB engine,
-- but the Data API (PostgREST) won't expose them as RPCs to authenticated users.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM authenticated;

-- For admin_list_users, if it's called via RPC from the frontend, it needs 'authenticated'.
-- If it's only called from server functions via the admin client, we can revoke it.
-- Based on typical TanStack Start patterns, it's likely called via a server function.
REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM authenticated;

-- Ensure service_role can still execute them
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO service_role;

-- Also check if 'authenticator' role was granted
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM authenticator;