
CREATE OR REPLACE FUNCTION public.decrement_stock(var_id uuid, amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.variacoes_produto
  SET quantidade_estoque = quantidade_estoque - amount
  WHERE id = var_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) TO service_role;
