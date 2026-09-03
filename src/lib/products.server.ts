import { supabase } from "@/integrations/supabase/client";

export type Categoria = { id: string; nome: string; slug: string; ordem: number };

export type Produto = {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  categoria_id: string | null;
  marca: string | null;
  novidade: boolean;
  promocao: boolean;
  preco_promocional: number | null;
  promocao_ate: string | null;
  ativo: boolean;
  ordem?: number;
};

export type ImagemProduto = {
  id: string;
  produto_id: string;
  storage_path: string;
  principal: boolean;
  ordem: number;
};

export type VariacaoProduto = {
  id: string;
  produto_id: string;
  nome_cor: string;
  hex_cor: string;
  tamanho: string;
  quantidade_estoque: number;
};

export type ProductListItem = Produto & {
  imagens: ImagemProduto[];
  variacoes: VariacaoProduto[];
};

export async function listCategorias(): Promise<Categoria[]> {
  const { data, error } = await supabase
    .from("categorias")
    .select("id,nome,slug,ordem")
    .order("ordem");
  if (error) throw error;
  return data ?? [];
}

export async function listProdutos(): Promise<ProductListItem[]> {
  const { data, error } = await supabase
    .from("produtos")
    .select("*, imagens:imagens_produto(*), variacoes:variacoes_produto(*)")
    .eq("ativo", true)
    .order("ordem", { ascending: true })
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProductListItem[];
}

export async function getProduto(id: string): Promise<ProductListItem | null> {
  const { data, error } = await supabase
    .from("produtos")
    .select("*, imagens:imagens_produto(*), variacoes:variacoes_produto(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as ProductListItem | null;
}
