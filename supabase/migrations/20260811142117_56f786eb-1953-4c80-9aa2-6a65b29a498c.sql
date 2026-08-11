-- Revoke execute from public/authenticated on security definer functions to satisfy linter
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_setup() FROM PUBLIC, authenticated;

-- Ensure service_role and owner still have access
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user_setup() TO service_role;
