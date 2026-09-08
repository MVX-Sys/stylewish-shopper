
-- 1) Baixa de estoque atômica e segura
CREATE OR REPLACE FUNCTION public.decrement_stock(var_id uuid, amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _updated int;
BEGIN
  UPDATE public.variacoes_produto
  SET quantidade_estoque = quantidade_estoque - amount
  WHERE id = var_id AND quantidade_estoque >= amount;
  GET DIAGNOSTICS _updated = ROW_COUNT;
  IF _updated = 0 THEN
    RAISE EXCEPTION 'ESTOQUE_INSUFICIENTE';
  END IF;
END;
$function$;

-- 2) Status do pedido: estoque já sai na criação (pendente). Só devolve/retira ao cancelar/reativar.
CREATE OR REPLACE FUNCTION public.set_pedido_status(_pedido_id uuid, _status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  _baixado := _atual <> 'cancelado';
  _sera_baixado := _status <> 'cancelado';

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
$function$;

-- 3) Auditoria: somente staff registra, e apenas em seu próprio nome
DROP POLICY IF EXISTS "System can insert audit logs" ON public.admin_audit_log;
DROP POLICY IF EXISTS "usuário registra própria ação" ON public.admin_audit_log;
CREATE POLICY "Staff registra auditoria"
ON public.admin_audit_log FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_staff(auth.uid()));

-- 4) Cupons deixam de ser públicos
DROP POLICY IF EXISTS "Public can read coupons" ON public.cupons;
REVOKE SELECT ON public.cupons FROM anon;
