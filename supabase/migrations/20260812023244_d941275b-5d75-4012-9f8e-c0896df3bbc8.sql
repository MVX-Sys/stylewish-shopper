
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos TO authenticated;
GRANT ALL ON public.produtos TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.imagens_produto TO authenticated;
GRANT ALL ON public.imagens_produto TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.variacoes_produto TO authenticated;
GRANT ALL ON public.variacoes_produto TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias TO authenticated;
GRANT ALL ON public.categorias TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.atendentes TO authenticated;
GRANT ALL ON public.atendentes TO service_role;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::public.app_role)
      OR public.has_role(_user_id, 'funcionario'::public.app_role);
$$;

GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, anon, service_role;

CREATE POLICY "staff gerencia produtos" ON public.produtos
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "staff gerencia imagens" ON public.imagens_produto
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "staff gerencia variacoes" ON public.variacoes_produto
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "staff gerencia categorias" ON public.categorias
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "staff gerencia atendentes" ON public.atendentes
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));
