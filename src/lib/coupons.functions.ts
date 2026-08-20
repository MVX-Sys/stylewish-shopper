import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listCupons = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from("cupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  });

export const saveCupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().optional(),
        codigo: z.string().min(1),
        tipo_desconto: z.enum(["percentual", "fixo"]),
        valor_desconto: z.number().min(0),
        quantidade_minima_itens: z.number().min(0),
        validade: z.string().nullable(),
        ativo: z.boolean(),
        produtos_ids: z.array(z.string()).nullable().optional(),
        categorias_ids: z.array(z.string()).nullable().optional(),
        preco_minimo_pedido: z.number().nullable().optional(),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const { supabase } = context;

    if (id) {
      const { data: updated, error } = await supabase
        .from("cupons")
        .update(rest)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    } else {
      const { data: inserted, error } = await supabase
        .from("cupons")
        .insert(rest)
        .select()
        .single();
      if (error) throw error;
      return inserted;
    }
  });

export const deleteCupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("cupons").delete().eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });

export const validateCupon = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ codigo: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const { data: cupom, error } = await supabase
      .from("cupons")
      .select("*")
      .eq("codigo", data.codigo.toUpperCase())
      .eq("ativo", true)
      .maybeSingle();

    if (error) throw error;
    if (!cupom) return { valid: false, message: "Cupom não encontrado ou inativo." };

    if (cupom.validade && new Date(cupom.validade).getTime() < Date.now()) {
      return { valid: false, message: "Este cupom expirou." };
    }

    return { valid: true, cupom };
  });
