ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS atendente_id uuid REFERENCES public.atendentes(id),
ADD COLUMN IF NOT EXISTS cliente_nome text,
ADD COLUMN IF NOT EXISTS cliente_whatsapp text;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos TO authenticated;
GRANT ALL ON public.pedidos TO service_role;