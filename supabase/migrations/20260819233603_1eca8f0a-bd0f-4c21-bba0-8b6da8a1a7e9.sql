ALTER TABLE public.pedidos ADD COLUMN cupom_codigo text;
ALTER TABLE public.pedidos ADD COLUMN desconto_cupom numeric DEFAULT 0;