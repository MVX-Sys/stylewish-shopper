-- 1) Add new enum value
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'funcionario';

-- 2) Permissions table
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  permission text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, permission)
);

GRANT SELECT ON public.user_permissions TO authenticated;
GRANT ALL ON public.user_permissions TO service_role;

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own permissions" ON public.user_permissions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "admin reads all permissions" ON public.user_permissions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 3) has_permission helper
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _perm text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin') OR EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = _user_id AND permission = _perm
  )
$$;

-- 4) RLS additions for "funcionario" with proper permission
-- Produtos and related content
CREATE POLICY "funcionario gerencia produtos" ON public.produtos
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'produtos.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'produtos.manage'));

CREATE POLICY "funcionario gerencia categorias" ON public.categorias
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'produtos.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'produtos.manage'));

CREATE POLICY "funcionario gerencia imagens" ON public.imagens_produto
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'produtos.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'produtos.manage'));

CREATE POLICY "funcionario gerencia variacoes" ON public.variacoes_produto
  FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'produtos.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'produtos.manage'));

-- Solicitações de reposição
CREATE POLICY "funcionario le solicitacoes" ON public.solicitacoes_reposicao
  FOR SELECT TO authenticated
  USING (public.has_permission(auth.uid(), 'solicitacoes.manage'));

CREATE POLICY "funcionario atualiza solicitacoes" ON public.solicitacoes_reposicao
  FOR UPDATE TO authenticated
  USING (public.has_permission(auth.uid(), 'solicitacoes.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'solicitacoes.manage'));

CREATE POLICY "funcionario apaga solicitacoes" ON public.solicitacoes_reposicao
  FOR DELETE TO authenticated
  USING (public.has_permission(auth.uid(), 'solicitacoes.manage'));

-- Auditoria
CREATE POLICY "funcionario le auditoria" ON public.admin_audit_log
  FOR SELECT TO authenticated
  USING (public.has_permission(auth.uid(), 'auditoria.view'));