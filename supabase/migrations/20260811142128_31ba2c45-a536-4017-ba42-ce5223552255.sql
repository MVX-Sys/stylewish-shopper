REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO service_role;
