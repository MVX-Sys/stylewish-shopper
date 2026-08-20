-- Ativar RLS
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Política para permitir que administradores vejam tudo
CREATE POLICY "Admins can view all audit logs"
ON public.admin_audit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Política para permitir que funcionários com permissão vejam os logs
CREATE POLICY "Staff with audit permission can view logs"
ON public.admin_audit_log
FOR SELECT
TO authenticated
USING (public.has_permission(auth.uid(), 'auditoria.view'));

-- Política para permitir inserção
CREATE POLICY "System can insert audit logs"
ON public.admin_audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Conceder permissões básicas de API
GRANT SELECT, INSERT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
