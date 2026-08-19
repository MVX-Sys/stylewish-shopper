CREATE TABLE public.cupons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo text UNIQUE NOT NULL,
    tipo_desconto text NOT NULL DEFAULT 'percentual',
    valor_desconto numeric NOT NULL,
    quantidade_minima_itens integer NOT NULL DEFAULT 0,
    validade timestamp with time zone,
    ativo boolean NOT NULL DEFAULT true,
    produtos_ids uuid[] DEFAULT NULL,
    created_at timestamp with time zone DEFAULT now()
);

GRANT SELECT ON public.cupons TO authenticated;
GRANT ALL ON public.cupons TO service_role;

ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage coupons"
ON public.cupons
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can select active coupons"
ON public.cupons
FOR SELECT
TO authenticated
USING (ativo = true AND (validade IS NULL OR validade > now()));