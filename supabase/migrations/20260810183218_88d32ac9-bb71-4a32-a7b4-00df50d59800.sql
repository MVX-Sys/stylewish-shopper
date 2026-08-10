CREATE TABLE public.site_config (
    id text PRIMARY KEY DEFAULT 'current',
    hero_type text NOT NULL DEFAULT 'gradient' CHECK (hero_type IN ('gradient', 'image', 'video')),
    hero_media_url text,
    hero_title text DEFAULT 'Estilo Urbano Sem Limites',
    updated_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.site_config TO anon;
GRANT SELECT ON public.site_config TO authenticated;
GRANT ALL ON public.site_config TO service_role;
GRANT ALL ON public.site_config TO authenticated;

ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-only access" ON public.site_config FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access" ON public.site_config FOR ALL TO authenticated USING (true);

INSERT INTO public.site_config (id, hero_type) VALUES ('current', 'gradient') ON CONFLICT DO NOTHING;