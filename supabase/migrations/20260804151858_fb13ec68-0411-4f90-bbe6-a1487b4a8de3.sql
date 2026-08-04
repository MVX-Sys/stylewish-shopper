GRANT SELECT ON public.atendentes TO anon, authenticated;
GRANT ALL ON public.atendentes TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.atendentes TO authenticated;
ALTER TABLE public.atendentes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "atendentes públicos" ON public.atendentes;
CREATE POLICY "atendentes públicos" ON public.atendentes FOR SELECT USING (ativo = true);
DROP POLICY IF EXISTS "admin gerencia atendentes" ON public.atendentes;
CREATE POLICY "admin gerencia atendentes" ON public.atendentes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
