-- 1. Fix search_path for has_role
ALTER FUNCTION public.has_role(_user_id uuid, _role public.app_role) SET search_path = public;

-- 2. Revoke public execute from security definer functions if they were accidentally public
-- list_users was mentioned in context summary as a security definer function
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Ensure other sensitive functions mentioned in context follow best practices
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'admin_list_users') THEN
    EXECUTE 'ALTER FUNCTION public.admin_list_users() SET search_path = public';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM public';
  END IF;
END $$;