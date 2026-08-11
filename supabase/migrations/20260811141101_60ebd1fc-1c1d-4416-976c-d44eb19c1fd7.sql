-- Garante que NINGUÉM (anon ou authenticated) consiga executar as funções SECURITY DEFINER diretamente
-- apenas o banco de dados (via triggers) ou o service_role.

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, authenticated, anon;
REVOKE ALL ON FUNCTION public.has_permission(uuid, text) FROM PUBLIC, authenticated, anon;
REVOKE ALL ON FUNCTION public.handle_new_user_setup() FROM PUBLIC, authenticated, anon;

-- Garante que o service_role ainda possa usar se necessário (has_role é usado em RLS)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user_setup() TO service_role;
