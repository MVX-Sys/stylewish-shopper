import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

export type AtendenteRow = {
  id: string;
  nome: string;
  whatsapp: string;
  foto_path: string | null;
  cargo: string | null;
  ativo: boolean;
  criado_em: string;
};

export const listAtendentes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("atendentes" as any)
      .select("*")
      .order("criado_em", { ascending: false });

    if (error) throw error;
    return (data as unknown) as AtendenteRow[];
  });

export const createAtendente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      nome: z.string().min(1),
      whatsapp: z.string().min(8),
      foto_path: z.string().optional().nullable(),
      cargo: z.string().optional(),
    })
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: atendente, error } = await supabase
      .from("atendentes" as any)
      .insert({ ...data, ativo: true })
      .select()
      .single();

    if (error) throw error;
    await logAudit({ acao: "criar", entidade: "atendente", entidade_id: (atendente as any).id, descricao: `Criou atendente ${data.nome}` });
    return (atendente as unknown) as AtendenteRow;
  });

export const updateAtendente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      nome: z.string().optional(),
      whatsapp: z.string().optional(),
      foto_path: z.string().optional().nullable(),
      cargo: z.string().optional(),
      ativo: z.boolean().optional(),
    })
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { id, ...updates } = data;
    const { data: atendente, error } = await supabase
      .from("atendentes" as any)
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    await logAudit({ acao: "editar", entidade: "atendente", entidade_id: id, descricao: `Editou atendente ${data.nome || id}` });
    return (atendente as unknown) as AtendenteRow;
  });

export const deleteAtendente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: atendente } = await supabase.from("atendentes" as any).select("nome").eq("id", data.id).single();
    const { error } = await supabase.from("atendentes" as any).delete().eq("id", data.id);
    if (error) throw error;
    await logAudit({ acao: "excluir", entidade: "atendente", entidade_id: data.id, descricao: `Excluiu atendente ${atendente?.nome || data.id}` });
    return { success: true };
  });