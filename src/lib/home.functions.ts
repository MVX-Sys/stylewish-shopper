import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export type CategoryWithTopProduct = {
  id: string;
  nome: string;
  slug: string;
  ordem: number;
  totalSales: number;
  topProduct: {
    id: string;
    nome: string;
    imagem: string | null;
  } | null;
};

export const getTopSellingProductsByCategory = createServerFn({ method: "GET" })
  .handler(async (): Promise<CategoryWithTopProduct[]> => {
    // Get categories first
    const { data: categories, error: catError } = await supabase
      .from("categorias")
      .select("id, nome, slug, ordem")
      .order("ordem");

    if (catError) throw catError;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get sales in the last 7 days
    // We join with pedidos to filter by date
    const { data: sales, error: salesError } = await supabase
      .from("pedidos_itens")
      .select(`
        produto_id,
        quantidade,
        pedidos!inner(criado_em)
      `)
      .gte("pedidos.criado_em", sevenDaysAgo.toISOString());

    if (salesError) throw salesError;

    // Aggregate sales by product_id
    const productSales: Record<string, number> = {};
    (sales || []).forEach((item: any) => {
      if (item.produto_id) {
        productSales[item.produto_id] = (productSales[item.produto_id] || 0) + item.quantidade;
      }
    });

    // For each category, find the best selling product and total sales
    const categoryTopSellers = await Promise.all(
      (categories || []).map(async (cat: any) => {
        // Fetch products for this category
        // We include variations to check stock
        const { data: products, error: prodError } = await supabase
          .from("produtos")
          .select(`
            id, 
            nome, 
            categoria_id, 
            variacoes:variacoes_produto(quantidade_estoque),
            imagens:imagens_produto(storage_path, principal)
          `)
          .eq("categoria_id", cat.id)
          .eq("ativo", true);

        if (prodError || !products) return { ...cat, totalSales: 0, topProduct: null };

        // Calculate total sales for this category
        let totalCatSales = 0;
        products.forEach((p: any) => {
          totalCatSales += productSales[p.id] || 0;
        });

        // Sort products by:
        // 1. Sales (last 7 days)
        // 2. Stock quantity (if sales are 0 or equal)
        const sortedProducts = products.sort((a: any, b: any) => {
          const salesA = productSales[a.id] || 0;
          const salesB = productSales[b.id] || 0;
          
          if (salesB !== salesA) {
            return salesB - salesA;
          }
          
          // Fallback to total stock if no sales
          const stockA = (a.variacoes || []).reduce((acc: number, v: any) => acc + (v.quantidade_estoque || 0), 0);
          const stockB = (b.variacoes || []).reduce((acc: number, v: any) => acc + (v.quantidade_estoque || 0), 0);
          return stockB - stockA;
        });

        // The top product is the first one in the sorted list
        const topProduct = sortedProducts[0] || null;
        const mainImg = topProduct?.imagens?.find((img: any) => img.principal) || topProduct?.imagens?.[0];

        return {
          ...cat,
          totalSales: totalCatSales,
          topProduct: topProduct ? {
            id: topProduct.id,
            nome: topProduct.nome,
            imagem: mainImg?.storage_path || null
          } : null
        };
      })
    );

    // Sort categories from most sold to least sold and remove "Geral"
    return categoryTopSellers
      .filter((cat) => cat.nome.toLowerCase() !== "geral")
      .sort((a, b) => b.totalSales - a.totalSales);
  });
114: 
115: export const getMonthlyTopSellers = createServerFn({ method: "GET" })
116:   .handler(async () => {
117:     const oneMonthAgo = new Date();
118:     oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
119: 
120:     const { data: sales, error: salesError } = await supabase
121:       .from("pedidos_itens")
122:       .select(`
123:         produto_id,
124:         quantidade,
125:         pedidos!inner(criado_em)
126:       `)
127:       .gte("pedidos.criado_em", oneMonthAgo.toISOString());
128: 
129:     if (salesError) throw salesError;
130: 
131:     const productSales: Record<string, number> = {};
132:     (sales || []).forEach((item: any) => {
133:       if (item.produto_id) {
134:         productSales[item.produto_id] = (productSales[item.produto_id] || 0) + item.quantidade;
135:       }
136:     });
137: 
138:     const topProductIds = Object.entries(productSales)
139:       .sort(([, a], [, b]) => b - a)
140:       .slice(0, 8)
141:       .map(([id]) => id);
142: 
143:     if (topProductIds.length === 0) return [];
144: 
145:     const { data: products, error: productsError } = await supabase
146:       .from("produtos")
147:       .select(`
148:         *,
149:         variacoes:variacoes_produto(quantidade_estoque),
150:         imagens:imagens_produto(storage_path, principal)
151:       `)
152:       .in("id", topProductIds)
153:       .eq("ativo", true);
154: 
155:     if (productsError) throw productsError;
156: 
157:     return products
158:       .map(p => ({
159:         ...p,
160:         totalSales: productSales[p.id] || 0
161:       }))
162:       .sort((a, b) => b.totalSales - a.totalSales);
163:   });

