import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      itens: z.array(
        z.object({
          produto_id: z.string(),
          variacao_id: z.string(),
          quantidade: z.number(),
          preco_unitario: z.number(),
          nome: z.string(),
          cor: z.string(),
          tamanho: z.string(),
        })
      ),
      total: z.number(),
      forma_envio: z.string(),
      forma_pagamento: z.string(),
      endereco: z.any().optional(),
      observacoes: z.string().optional(),
      atendente_id: z.string().optional(),
      cliente_nome: z.string().optional(),
      cliente_whatsapp: z.string().optional(),
      cupom_codigo: z.string().optional(),
      desconto_cupom: z.number().optional(),
    })

  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // 0. Verificar estoque antes de criar o pedido
    for (const item of data.itens) {
      const { data: varData, error: varErr } = await supabase
        .from("variacoes_produto")
        .select("quantidade_estoque, nome_cor, tamanho")
        .eq("id", item.variacao_id)
        .single();
      
      if (varErr) throw new Error(`Erro ao verificar estoque do produto ${item.nome}`);
      if (!varData || varData.quantidade_estoque < item.quantidade) {
        throw new Error(`Estoque insuficiente para ${item.nome} (${varData?.nome_cor || item.cor}, ${varData?.tamanho || item.tamanho}). Disponível: ${varData?.quantidade_estoque || 0}`);
      }
    }

    // 1. Inserir o pedido principal
    const { data: order, error: orderErr } = await supabase
      .from("pedidos")
      .insert({
        user_id: userId,
        total: data.total,
        status: "pendente",
        forma_envio: data.forma_envio,
        forma_pagamento: data.forma_pagamento,
        endereco: data.endereco,
        observacoes: data.observacoes,
        atendente_id: data.atendente_id as any,
        cliente_nome: data.cliente_nome as any,
        cliente_whatsapp: data.cliente_whatsapp as any,
        cupom_codigo: data.cupom_codigo as any,
        desconto_cupom: data.desconto_cupom as any,
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    // 2. Inserir os itens do pedido
    const orderItems = data.itens.map((item) => ({
      pedido_id: order.id,
      produto_id: item.produto_id,
      variacao_id: item.variacao_id,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      detalhes: { cor: item.cor, tamanho: item.tamanho, nome: item.nome },
    }));

    const { error: itemsErr } = await supabase.from("pedidos_itens").insert(orderItems);
    if (itemsErr) throw itemsErr;

    // 3. Atualizar estoque (diminuir a quantidade comprada)
    for (const item of data.itens) {
      const { error: stockErr } = await supabase.rpc('decrement_stock', {
        var_id: item.variacao_id,
        amount: item.quantidade
      });
      if (stockErr) {
        console.error(`Erro ao atualizar estoque para ${item.variacao_id}:`, stockErr);
        // Não lançamos erro aqui para não travar o pedido se já foi criado, 
        // mas em um cenário ideal usaríamos uma transação SQL.
      }
    }

    return order;
  });

export const listUserOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("pedidos")
      .select("*, itens:pedidos_itens(*)")
      .eq("user_id", userId)
      .order("criado_em", { ascending: false });

    if (error) throw error;
    return data;
  });
