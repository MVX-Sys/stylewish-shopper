
CREATE TABLE public.solicitacoes_reposicao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  cor text NOT NULL,
  tamanho text NOT NULL,
  cliente_nome text NOT NULL,
  cliente_whatsapp text NOT NULL,
  observacao text,
  status text NOT NULL DEFAULT 'pendente',
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_solic_produto ON public.solicitacoes_reposicao(produto_id);
CREATE INDEX idx_solic_status ON public.solicitacoes_reposicao(status);

GRANT INSERT ON public.solicitacoes_reposicao TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.solicitacoes_reposicao TO authenticated;
GRANT ALL ON public.solicitacoes_reposicao TO service_role;

ALTER TABLE public.solicitacoes_reposicao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qualquer um pode solicitar reposicao"
  ON public.solicitacoes_reposicao FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(cliente_nome) BETWEEN 1 AND 120
    AND length(cliente_whatsapp) BETWEEN 8 AND 40
    AND length(cor) BETWEEN 1 AND 60
    AND length(tamanho) BETWEEN 1 AND 20
    AND (observacao IS NULL OR length(observacao) <= 500)
    AND status = 'pendente'
  );

CREATE POLICY "admin le solicitacoes"
  ON public.solicitacoes_reposicao FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin atualiza solicitacoes"
  ON public.solicitacoes_reposicao FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin apaga solicitacoes"
  ON public.solicitacoes_reposicao FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.tg_touch_atualizado_em()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.atualizado_em := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_solic_touch
  BEFORE UPDATE ON public.solicitacoes_reposicao
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_atualizado_em();
