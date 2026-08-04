CREATE TABLE public.atendentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    foto_path TEXT,
    cargo TEXT DEFAULT 'Vendedor',
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT ON public.atendentes TO anon, authenticated;
GRANT ALL ON public.atendentes TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.atendentes TO authenticated;

ALTER TABLE public.atendentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "atendentes públicos" ON public.atendentes FOR SELECT USING (ativo = true);
CREATE POLICY "admin gerencia atendentes" ON public.atendentes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Inserir o Gustavo como primeiro atendente
INSERT INTO public.atendentes (nome, whatsapp, foto_path, cargo)
VALUES ('Gustavo', '5587991547820', 'atendente-gustavo.jpg', 'Vendedor');
