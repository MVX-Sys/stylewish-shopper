
-- Roles enum + user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- First-user-admin claim: allow authenticated users to insert admin role only when no admin exists yet
CREATE POLICY "claim first admin" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    role = 'admin'
    AND user_id = auth.uid()
    AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
  );

-- Categorias
CREATE TABLE public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  ordem INT NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categorias TO anon, authenticated;
GRANT ALL ON public.categorias TO service_role;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categorias públicas" ON public.categorias FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin gerencia categorias" ON public.categorias FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Produtos
CREATE TABLE public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC(10,2) NOT NULL CHECK (preco >= 0),
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  marca TEXT,
  novidade BOOLEAN NOT NULL DEFAULT false,
  promocao BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.produtos TO anon, authenticated;
GRANT ALL ON public.produtos TO service_role;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "produtos públicos" ON public.produtos FOR SELECT TO anon, authenticated USING (ativo = true);
CREATE POLICY "admin lê tudo" ON public.produtos FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin gerencia produtos" ON public.produtos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Imagens
CREATE TABLE public.imagens_produto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  principal BOOLEAN NOT NULL DEFAULT false,
  ordem INT NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.imagens_produto TO anon, authenticated;
GRANT ALL ON public.imagens_produto TO service_role;
ALTER TABLE public.imagens_produto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "imagens públicas" ON public.imagens_produto FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin gerencia imagens" ON public.imagens_produto FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX ON public.imagens_produto(produto_id);

-- Variações
CREATE TABLE public.variacoes_produto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  nome_cor TEXT NOT NULL,
  hex_cor TEXT NOT NULL DEFAULT '#000000',
  tamanho TEXT NOT NULL,
  quantidade_estoque INT NOT NULL DEFAULT 0 CHECK (quantidade_estoque >= 0),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (produto_id, nome_cor, tamanho)
);
GRANT SELECT ON public.variacoes_produto TO anon, authenticated;
GRANT ALL ON public.variacoes_produto TO service_role;
ALTER TABLE public.variacoes_produto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "variacoes públicas" ON public.variacoes_produto FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin gerencia variacoes" ON public.variacoes_produto FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX ON public.variacoes_produto(produto_id);

-- Storage policies: allow anon/authenticated to read product-images; admins to write
CREATE POLICY "leitura pública product-images" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'product-images');

CREATE POLICY "admin upload product-images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin atualiza product-images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin apaga product-images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- Seed categorias
INSERT INTO public.categorias (nome, slug, ordem) VALUES
  ('Camisa', 'camisa', 1),
  ('Calça', 'calca', 2),
  ('Acessórios', 'acessorios', 3),
  ('Gola polo', 'gola-polo', 4),
  ('Bermudas', 'bermudas', 5),
  ('Conjuntos', 'conjuntos', 6),
  ('Regata', 'regata', 7),
  ('Casaco', 'casaco', 8),
  ('Camisa infantil', 'camisa-infantil', 9);
