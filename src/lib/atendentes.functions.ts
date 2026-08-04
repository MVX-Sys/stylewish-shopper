import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listAtendentes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("atendentes")
      .select("*")
      .order("criado_em", { ascending: false });

    if (error) throw error;
    return data;
  });

export const createAtendente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      nome: z.string().min(1),
      whatsapp: z.string().min(8),
      foto_path: z.string().optional(),
      cargo: z.string().optional(),
    })
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: atendente, error } = await supabase
      .from("atendentes")
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return atendente;
  });

export const updateAtendente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      nome: z.string().optional(),
      whatsapp: z.string().optional(),
      foto_path: z.string().optional(),
      cargo: z.string().optional(),
      ativo: z.boolean().optional(),
    })
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { id, ...updates } = data;
    const { data: atendente, error } = await supabase
      .from("atendentes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return atendente;
  });

export const deleteAtendente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("atendentes").delete().eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });
