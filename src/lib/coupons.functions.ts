import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertCouponManager(ctx: {
  supabase: any;
  userId: string;
}) {
  const { data: hasPerm, error } = await ctx.supabase.rpc("has_permission", {
    _user_id: ctx.userId,
    _permission: "cupons.manage",
  });
  if (error) throw new Error(error.message);
  if (!hasPerm) throw new Response("Forbidden", { status: 403 });
}

export const listCupons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
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
    await assertCouponManager(context);
    const { supabase } = context;
    const { id, ...rest } = data;
    
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
    await assertCouponManager(context);
    const { supabase } = context;
    const { error } = await supabase.from("cupons").delete().eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });

export const validateCupon = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ codigo: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    // For validation we can use the default supabase client as it needs to be public
    // but the db policies allow public read now.
    const { supabase: supabaseClient } = await import("@/integrations/supabase/client");
    const { data: cupom, error } = await supabaseClient
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
