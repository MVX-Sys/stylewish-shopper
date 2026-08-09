import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export type CategoryWithTopProduct = {
  id: string;
  nome: string;
  slug: string;
  ordem: number;
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

    // For each category, find the best selling product
    const categoryTopSellers = await Promise.all(
      (categories || []).map(async (cat: any) => {
        // Fetch products for this category
        const { data: products, error: prodError } = await supabase
          .from("produtos")
          .select("id, nome, categoria_id, imagens:imagens_produto(storage_path, principal)")
          .eq("categoria_id", cat.id)
          .eq("ativo", true);

        if (prodError || !products) return { ...cat, topProduct: null };

        // Sort products by sales
        const sortedProducts = products.sort((a: any, b: any) => {
          const salesA = productSales[a.id] || 0;
          const salesB = productSales[b.id] || 0;
          return salesB - salesA;
        });

        // The top product is the first one in the sorted list
        const topProduct = sortedProducts[0] || null;
        const mainImg = topProduct?.imagens?.find((img: any) => img.principal) || topProduct?.imagens?.[0];

        return {
          ...cat,
          topProduct: topProduct ? {
            id: topProduct.id,
            nome: topProduct.nome,
            imagem: mainImg?.storage_path || null
          } : null
        };
      })
    );

    return categoryTopSellers;
  });

