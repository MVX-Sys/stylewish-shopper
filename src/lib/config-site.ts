import { supabase } from "@/integrations/supabase/client";

export type HeroSlide = {
  id: string;
  tipo: 'gradient' | 'image' | 'video';
  media_url: string | null;
  titulo: string;
  subtitulo: string | null;
  ordem: number;
  ativo: boolean;
};

export type SiteConfig = {
  id: string;
  hero_slides: HeroSlide[];
};

export async function getSiteConfig(): Promise<SiteConfig> {
  // Fetch main config
  const { data: config, error: configError } = await supabase
    .from("site_config")
    .select("*")
    .eq("id", "current")
    .single();
  
  // Fetch hero slides
  const { data: slides, error: slidesError } = await supabase
    .from("hero_slides")
    .select("*")
    .order("ordem", { ascending: true });

  if (configError) {
    console.error("Error fetching site config:", configError);
  }

  return {
    id: "current",
    hero_slides: slides || []
  };
}

export async function updateHeroSlide(id: string, slide: Partial<Omit<HeroSlide, 'id'>>) {
  const { error } = await supabase
    .from("hero_slides")
    .update(slide)
    .eq("id", id);
  
  if (error) throw error;
}

export async function createHeroSlide(slide: Omit<HeroSlide, 'id'>) {
  const { data, error } = await supabase
    .from("hero_slides")
    .insert(slide)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteHeroSlide(id: string) {
  const { error } = await supabase
    .from("hero_slides")
    .delete()
    .eq("id", id);
  
  if (error) throw error;
}
