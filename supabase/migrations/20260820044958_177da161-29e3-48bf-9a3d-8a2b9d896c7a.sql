
-- Revogar execucao publica por seguranca (Supabase as vezes concede por padrao no public)
REVOKE EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) FROM anon;

-- Apenas authenticated e service_role podem executar
GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) TO service_role;
