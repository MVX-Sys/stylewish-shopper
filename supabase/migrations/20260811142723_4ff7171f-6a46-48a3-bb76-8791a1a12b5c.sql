
-- Re-enable the trigger with a very safe implementation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_setup();

-- Grant explicitly to service_role on user_roles and user_permissions just in case
GRANT ALL ON public.user_roles TO service_role;
GRANT ALL ON public.user_permissions TO service_role;
