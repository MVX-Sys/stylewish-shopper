import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type PedidoItem = {
  id: string;
  pedido_id: string;
  produto_id: string | null;
  nome_produto: string;
  quantidade: number;
  preco_unitario: number;
  cor: string | null;
  tamanho: string | null;
  imagem_url: string | null;
};

export type PedidoRow = {
  id: string;
  created_at: string;
  usuario_id: string | null;
  cliente_nome: string;
  cliente_whatsapp: string;
  atendente_id: string | null;
  total: number;
  status: string;
  forma_pagamento: string | null;
  forma_envio: string | null;
  observacoes: string | null;
  itens?: PedidoItem[];
  atendente?: { nome: string } | null;
};

export const listPedidos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      usuario_id: z.string().optional(),
      atendente_id: z.string().optional(),
      periodo: z.enum(["dia", "semana", "mes", "semestre", "todos"]).optional(),
    }).optional()
  )
  .handler(async ({ input, context }) => {
    const { supabase } = context;
    let query = supabase
      .from("pedidos")
      .select(`
        *,
        atendente:atendentes(nome),
        itens:pedidos_itens(*)
      `)
      .order("created_at", { ascending: false });

    if (input?.usuario_id) {
      query = query.eq("usuario_id", input.usuario_id);
    }
    if (input?.atendente_id) {
      query = query.eq("atendente_id", input.atendente_id);
    }

    if (input?.periodo && input.periodo !== "todos") {
      const now = new Date();
      let startDate = new Date();
      if (input.periodo === "dia") startDate.setDate(now.getDate() - 1);
      else if (input.periodo === "semana") startDate.setDate(now.getDate() - 7);
      else if (input.periodo === "mes") startDate.setMonth(now.getMonth() - 1);
      else if (input.periodo === "semestre") startDate.setMonth(now.getMonth() - 6);
      
      query = query.gte("created_at", startDate.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as PedidoRow[];
  });

export const updatePedidoStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid(), status: z.string() }))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("pedidos")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw error;
    return { success: true };
  });
