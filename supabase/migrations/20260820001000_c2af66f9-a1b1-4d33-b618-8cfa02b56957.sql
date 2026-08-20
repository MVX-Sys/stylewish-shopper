GRANT ALL ON public.cupons TO authenticated;
GRANT ALL ON public.cupons TO service_role;
GRANT SELECT ON public.cupons TO anon;

ALTER TABLE public.cupons ADD COLUMN IF NOT EXISTS preco_minimo_pedido numeric DEFAULT 0;
ALTER TABLE public.cupons ADD COLUMN IF NOT EXISTS categorias_ids text[] DEFAULT '{}';
ALTER TABLE public.cupons DROP CONSTRAINT IF EXISTS cupons_tipo_desconto_check;
ALTER TABLE public.cupons ADD CONSTRAINT cupons_tipo_desconto_check CHECK (tipo_desconto IN ('percentual', 'fixo'));
