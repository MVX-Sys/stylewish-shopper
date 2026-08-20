import { supabase } from "@/integrations/supabase/client";

export type SiteConfig = {
  id: string;
  hero_type: 'gradient' | 'image' | 'video';
  hero_media_url: string | null;
  hero_title: string;
  hero_subtitle: string | null;
};

export async function getSiteConfig(): Promise<SiteConfig> {
  const { data, error } = await supabase
    .from("site_config")
    .select("*")
    .eq("id", "current")
    .single();
  
  if (error) {
    console.error("Error fetching site config:", error);
    return {
      id: "current",
      hero_type: 'gradient',
      hero_media_url: null,
      hero_title: 'Estilo Urbano Sem Limites',
      hero_subtitle: 'O melhor da moda masculina atacado'
    };
  }
  
  return data as SiteConfig;
}

export async function updateSiteConfig(config: Partial<Omit<SiteConfig, 'id'>>) {
  const { error } = await supabase
    .from("site_config")
    .update(config)
    .eq("id", "current");
  
  if (error) throw error;
}
