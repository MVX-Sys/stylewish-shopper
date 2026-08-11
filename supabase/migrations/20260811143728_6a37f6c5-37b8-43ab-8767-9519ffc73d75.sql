-- 1. Restaurar as permissões de execução dos usuários normais
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated, service_role, anon;

-- 2. Garantir que o authenticator pode ver o schema public por completo
GRANT USAGE ON SCHEMA public TO authenticator;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticator;

-- 3. Restaurar RLS (Segurança)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
