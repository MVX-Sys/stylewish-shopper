
-- Create enum for hero type if not exists
DO $$ BEGIN
    CREATE TYPE public.hero_type AS ENUM ('gradient', 'image', 'video');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create hero_slides table
CREATE TABLE IF NOT EXISTS public.hero_slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo public.hero_type NOT NULL DEFAULT 'gradient',
    media_url TEXT,
    titulo TEXT NOT NULL,
    subtitulo TEXT,
    ordem INTEGER NOT NULL DEFAULT 0,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Grant access
GRANT SELECT ON public.hero_slides TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.hero_slides TO authenticated;
GRANT ALL ON public.hero_slides TO service_role;

-- Enable RLS
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view active hero slides" ON public.hero_slides
    FOR SELECT USING (ativo = true);

CREATE POLICY "Staff can manage all hero slides" ON public.hero_slides
    FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'funcionario'));

-- Migration: Copy current site_config hero to hero_slides
INSERT INTO public.hero_slides (tipo, media_url, titulo, subtitulo, ordem, ativo)
SELECT 
    CASE 
        WHEN hero_type = 'video' THEN 'video'::public.hero_type
        WHEN hero_type = 'image' THEN 'image'::public.hero_type
        ELSE 'gradient'::public.hero_type
    END,
    hero_media_url,
    COALESCE(hero_title, 'ACHAEBUSCA'),
    hero_subtitle,
    0,
    true
FROM public.site_config
WHERE id = 'current'
ON CONFLICT DO NOTHING;
