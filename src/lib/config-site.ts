import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/audit";

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
  const { data: config, error: configError } = await supabase
    .from("site_config")
    .select("*")
    .eq("id", "current")
    .single();
  
  const { data: slides, error: slidesError } = await supabase
    .from("hero_slides")
    .select("*")
    .order("ordem", { ascending: true });

  if (configError) {
    console.error("Error fetching site config:", configError);
  }

  return {
    id: "current",
    hero_slides: (slides as any) || []
  };
}

export async function updateHeroSlide(id: string, slide: Partial<Omit<HeroSlide, 'id'>>) {
  const { error } = await supabase
    .from("hero_slides")
    .update(slide)
    .eq("id", id);
  
  if (error) throw error;
  await logAudit({ acao: "editar", entidade: "configuracao_site", entidade_id: id, descricao: `Editou slide do banner: ${slide.titulo || id}` });
}

export async function createHeroSlide(slide: Omit<HeroSlide, 'id'>) {
  const { data, error } = await supabase
    .from("hero_slides")
    .insert(slide)
    .select()
    .single();
  
  if (error) throw error;
  await logAudit({ acao: "criar", entidade: "configuracao_site", entidade_id: (data as any).id, descricao: `Criou novo slide no banner: ${slide.titulo}` });
  return data;
}

export async function deleteHeroSlide(id: string) {
  const { data: slide } = await supabase.from("hero_slides").select("titulo").eq("id", id).single();
  const { error } = await supabase
    .from("hero_slides")
    .delete()
    .eq("id", id);
  
  if (error) throw error;
  await logAudit({ acao: "excluir", entidade: "configuracao_site", entidade_id: id, descricao: `Excluiu slide do banner: ${slide?.titulo || id}` });
}