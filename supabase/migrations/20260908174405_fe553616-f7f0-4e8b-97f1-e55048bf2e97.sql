
REVOKE EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.set_pedido_status(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.set_produtos_ordem(uuid[]) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_pedido_status(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_produtos_ordem(uuid[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;
