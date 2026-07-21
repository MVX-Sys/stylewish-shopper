import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listProdutos, isEsgotado } from "@/lib/products";
import { getImageUrl } from "@/lib/storage";
import { brl } from "@/lib/format";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminProductsList,
});

function AdminProductsList() {
  const qc = useQueryClient();
  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ["admin-produtos"],
    queryFn: listProdutos,
  });
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  useEffect(() => {
    produtos.forEach((p) => {
      const img = p.imagens.find((i) => i.principal) ?? p.imagens[0];
      if (img && !thumbs[p.id])
        getImageUrl(img.storage_path).then((u) =>
          setThumbs((prev) => ({ ...prev, [p.id]: u })),
        );
    });
  }, [produtos, thumbs]);

  const del = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    const { error } = await supabase.from("produtos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Produto excluído.");
    qc.invalidateQueries({ queryKey: ["admin-produtos"] });
    qc.invalidateQueries({ queryKey: ["produtos"] });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Produtos</h1>
        <Link
          to="/admin/produtos/novo"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Novo produto
        </Link>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : produtos.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nenhum produto cadastrado. Comece adicionando um novo.
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="p-3"></th>
                <th className="p-3">Nome</th>
                <th className="p-3">Preço</th>
                <th className="p-3">Estoque</th>
                <th className="p-3">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((p) => {
                const total = p.variacoes.reduce(
                  (s, v) => s + v.quantidade_estoque,
                  0,
                );
                return (
                  <tr key={p.id} className="border-t border-border">
                    <td className="p-2">
                      <div className="h-12 w-12 overflow-hidden rounded-md bg-muted">
                        {thumbs[p.id] && (
                          <img
                            src={thumbs[p.id]}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-medium">{p.nome}</td>
                    <td className="p-3">{brl(p.preco)}</td>
                    <td className="p-3">{total}</td>
                    <td className="p-3">
                      {!p.ativo ? (
                        <span className="text-muted-foreground">Inativo</span>
                      ) : isEsgotado(p) ? (
                        <span className="text-destructive">Esgotado</span>
                      ) : (
                        <span className="text-emerald-600">Ativo</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          to="/admin/produtos/$id"
                          params={{ id: p.id }}
                          className="rounded-md p-2 hover:bg-accent"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => del(p.id)}
                          className="rounded-md p-2 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
