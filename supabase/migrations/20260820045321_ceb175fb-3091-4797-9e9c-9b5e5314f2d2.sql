GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) TO authenticated, anon, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon, service_role;