INSERT INTO public.categorias (nome, slug, ordem) VALUES
  ('Tênis', 'tenis', 10),
  ('Sandálias', 'sandalias', 11),
  ('Sapatos', 'sapatos', 12),
  ('Chinelos', 'chinelos', 13),
  ('Botas', 'botas', 14),
  ('Sapatênis', 'sapatenis', 15),
  ('Mocassim', 'mocassim', 16),
  ('Rasteirinha', 'rasteirinha', 17),
  ('Scarpin', 'scarpin', 18),
  ('Sapatilha', 'sapatilha', 19)
ON CONFLICT (slug) DO NOTHING;