CREATE TABLE public.admin_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  acao TEXT NOT NULL,
  entidade TEXT NOT NULL,
  entidade_id UUID,
  descricao TEXT,
  detalhes JSONB,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX admin_audit_log_criado_em_idx ON public.admin_audit_log (criado_em DESC);
CREATE INDEX admin_audit_log_entidade_idx ON public.admin_audit_log (entidade, entidade_id);
CREATE INDEX admin_audit_log_user_idx ON public.admin_audit_log (user_id);

GRANT SELECT, INSERT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin lê auditoria"
  ON public.admin_audit_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "usuário registra própria ação"
  ON public.admin_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);