ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS preco_promocional numeric,
  ADD COLUMN IF NOT EXISTS promocao_ate timestamptz;

ALTER TABLE public.produtos
  ADD CONSTRAINT produtos_preco_promocional_valido
  CHECK (preco_promocional IS NULL OR (preco_promocional >= 0 AND preco_promocional < preco));