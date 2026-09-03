ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS ordem integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS produtos_ordem_idx ON public.produtos (ordem, criado_em DESC);