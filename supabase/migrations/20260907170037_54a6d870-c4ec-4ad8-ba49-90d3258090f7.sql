-- Staff pode ver e atualizar todos os pedidos
CREATE POLICY "Staff can view all orders" ON public.pedidos
FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update orders" ON public.pedidos
FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can view all order items" ON public.pedidos_itens
FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- Alteração de status com ajuste de estoque
CREATE OR REPLACE FUNCTION public.set_pedido_status(_pedido_id uuid, _status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _atual text;
  _baixado boolean;
  _sera_baixado boolean;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF _status NOT IN ('pendente','confirmado','entregue','cancelado') THEN
    RAISE EXCEPTION 'status invalido';
  END IF;

  SELECT status INTO _atual FROM public.pedidos WHERE id = _pedido_id FOR UPDATE;
  IF _atual IS NULL THEN
    RAISE EXCEPTION 'pedido nao encontrado';
  END IF;

  _baixado := _atual IN ('confirmado','entregue');
  _sera_baixado := _status IN ('confirmado','entregue');

  IF (NOT _baixado) AND _sera_baixado THEN
    UPDATE public.variacoes_produto v
    SET quantidade_estoque = GREATEST(0, v.quantidade_estoque - i.qtd)
    FROM (SELECT variacao_id, SUM(quantidade)::int AS qtd
          FROM public.pedidos_itens WHERE pedido_id = _pedido_id AND variacao_id IS NOT NULL
          GROUP BY variacao_id) i
    WHERE v.id = i.variacao_id;
  ELSIF _baixado AND (NOT _sera_baixado) THEN
    UPDATE public.variacoes_produto v
    SET quantidade_estoque = v.quantidade_estoque + i.qtd
    FROM (SELECT variacao_id, SUM(quantidade)::int AS qtd
          FROM public.pedidos_itens WHERE pedido_id = _pedido_id AND variacao_id IS NOT NULL
          GROUP BY variacao_id) i
    WHERE v.id = i.variacao_id;
  END IF;

  UPDATE public.pedidos SET status = _status WHERE id = _pedido_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_pedido_status(uuid, text) TO authenticated;