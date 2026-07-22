import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listProdutos, isEsgotado } from "@/lib/products";
import { getImageUrl } from "@/lib/storage";
import { brl } from "@/lib/format";
import { Pencil, Trash2, Plus, Package, PackageX, PackageCheck, Search } from "lucide-react";
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
  const [q, setQ] = useState("");

  useEffect(() => {
    produtos.forEach((p) => {
      const img = p.imagens.find((i) => i.principal) ?? p.imagens[0];
      if (img && !thumbs[p.id])
        getImageUrl(img.storage_path).then((u) =>
          setThumbs((prev) => ({ ...prev, [p.id]: u })),
        );
    });
  }, [produtos, thumbs]);

  const stats = useMemo(() => {
    const total = produtos.length;
    const ativos = produtos.filter((p) => p.ativo && !isEsgotado(p)).length;
    const esgotados = produtos.filter((p) => isEsgotado(p)).length;
    const estoque = produtos.reduce(
      (s, p) => s + p.variacoes.reduce((a, v) => a + v.quantidade_estoque, 0),
      0,
    );
    return { total, ativos, esgotados, estoque };
  }, [produtos]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return produtos;
    return produtos.filter((p) => p.nome.toLowerCase().includes(query));
  }, [produtos, q]);

  const del = async (id: string) => {
    if (!confirm("Excluir este produto? Esta ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("produtos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Produto excluído.");
    qc.invalidateQueries({ queryKey: ["admin-produtos"] });
    qc.invalidateQueries({ queryKey: ["produtos"] });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Produtos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie o catálogo, estoque e variações da loja.
          </p>
        </div>
        <Link
          to="/admin/produtos/novo"
          className="btn-shine inline-flex items-center gap-2 self-start rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 sm:self-end"
        >
          <Plus className="h-4 w-4" /> Novo produto
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total", value: stats.total, icon: Package, tone: "bg-muted text-foreground" },
          { label: "Ativos", value: stats.ativos, icon: PackageCheck, tone: "bg-success/10 text-success" },
          { label: "Esgotados", value: stats.esgotados, icon: PackageX, tone: "bg-destructive/10 text-destructive" },
          { label: "Peças em estoque", value: stats.estoque, icon: Package, tone: "bg-brand/10 text-brand" },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {label}
              </span>
              <div className={`grid h-8 w-8 place-items-center rounded-full ${tone}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 font-display text-xl font-bold tabular-nums sm:text-2xl">
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar produto…"
              className="w-full rounded-full border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-foreground"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {filtered.length} de {produtos.length}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-14 rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-muted">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">
              {q ? "Nenhum resultado" : "Nenhum produto cadastrado"}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {q ? "Tente buscar por outro termo." : "Comece adicionando seu primeiro produto ao catálogo."}
            </p>
            {!q && (
              <Link
                to="/admin/produtos/novo"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background hover:opacity-90"
              >
                <Plus className="h-4 w-4" /> Adicionar produto
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="p-4 font-semibold">Produto</th>
                  <th className="p-4 font-semibold">Preço</th>
                  <th className="p-4 font-semibold">Estoque</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const total = p.variacoes.reduce(
                    (s, v) => s + v.quantidade_estoque,
                    0,
                  );
                  const esg = isEsgotado(p);
                  return (
                    <tr
                      key={p.id}
                      className="border-t border-border transition-colors hover:bg-muted/40"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                            {thumbs[p.id] ? (
                              <img
                                src={thumbs[p.id]}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="skeleton h-full w-full" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{p.nome}</p>
                            {p.marca && (
                              <p className="truncate text-xs text-muted-foreground">
                                {p.marca}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 tabular-nums">{brl(p.preco)}</td>
                      <td className="p-4">
                        <span className="tabular-nums">{total}</span>
                        <span className="ml-1 text-xs text-muted-foreground">pç</span>
                      </td>
                      <td className="p-4">
                        {!p.ativo ? (
                          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                            Inativo
                          </span>
                        ) : esg ? (
                          <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold text-destructive">
                            Esgotado
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
                            Ativo
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <Link
                            to="/admin/produtos/$id"
                            params={{ id: p.id }}
                            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            aria-label="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => del(p.id)}
                            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Excluir"
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
    </div>
  );
}
