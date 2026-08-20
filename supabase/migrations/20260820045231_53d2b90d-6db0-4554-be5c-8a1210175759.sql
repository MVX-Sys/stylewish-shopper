GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) TO service_role;