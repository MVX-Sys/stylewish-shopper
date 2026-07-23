import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listProdutos, listCategorias, isEsgotado } from "@/lib/products";
import { getImageUrl } from "@/lib/storage";
import { brl } from "@/lib/format";
import { Pencil, Trash2, Plus, Package, PackageX, PackageCheck, Search, X, SlidersHorizontal, Eye } from "lucide-react";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminProductsList,
});

type StatusFilter = "todos" | "ativos" | "inativos" | "esgotados" | "em-estoque";
type DestaqueFilter = "todos" | "novidade" | "promocao";
type SortKey =
  | "recentes"
  | "antigos"
  | "nome-asc"
  | "nome-desc"
  | "menor-preco"
  | "maior-preco"
  | "menor-estoque"
  | "maior-estoque";

function AdminProductsList() {
  const qc = useQueryClient();
  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ["admin-produtos"],
    queryFn: listProdutos,
  });
  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: listCategorias,
  });
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [categoriaId, setCategoriaId] = useState<string>("todas");
  const [marca, setMarca] = useState<string>("todas");
  const [cor, setCor] = useState<string>("todas");
  const [tamanho, setTamanho] = useState<string>("todos");
  const [status, setStatus] = useState<StatusFilter>("todos");
  const [destaque, setDestaque] = useState<DestaqueFilter>("todos");
  const [precoMin, setPrecoMin] = useState<string>("");
  const [precoMax, setPrecoMax] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("recentes");
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    produtos.forEach((p) => {
      const img = p.imagens.find((i) => i.principal) ?? p.imagens[0];
      if (img && !thumbs[p.id])
        getImageUrl(img.storage_path).then((u) =>
          setThumbs((prev) => ({ ...prev, [p.id]: u })),
        );
    });
  }, [produtos, thumbs]);

  const marcas = useMemo(() => {
    const s = new Set<string>();
    produtos.forEach((p) => p.marca && s.add(p.marca));
    return Array.from(s).sort();
  }, [produtos]);

  const cores = useMemo(() => {
    const s = new Set<string>();
    produtos.forEach((p) => p.variacoes.forEach((v) => v.nome_cor && s.add(v.nome_cor)));
    return Array.from(s).sort();
  }, [produtos]);

  const tamanhos = useMemo(() => {
    const s = new Set<string>();
    produtos.forEach((p) => p.variacoes.forEach((v) => v.tamanho && s.add(v.tamanho)));
    return Array.from(s).sort();
  }, [produtos]);

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

  const activeCount =
    (q ? 1 : 0) +
    (categoriaId !== "todas" ? 1 : 0) +
    (marca !== "todas" ? 1 : 0) +
    (cor !== "todas" ? 1 : 0) +
    (tamanho !== "todos" ? 1 : 0) +
    (status !== "todos" ? 1 : 0) +
    (destaque !== "todos" ? 1 : 0) +
    (precoMin ? 1 : 0) +
    (precoMax ? 1 : 0);

  const resetFilters = () => {
    setQ("");
    setCategoriaId("todas");
    setMarca("todas");
    setCor("todas");
    setTamanho("todos");
    setStatus("todos");
    setDestaque("todos");
    setPrecoMin("");
    setPrecoMax("");
    setSort("recentes");
  };

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const min = precoMin ? Number(precoMin) : null;
    const max = precoMax ? Number(precoMax) : null;
    const list = produtos.filter((p) => {
      if (query && !p.nome.toLowerCase().includes(query) && !(p.marca ?? "").toLowerCase().includes(query)) return false;
      if (categoriaId !== "todas" && p.categoria_id !== categoriaId) return false;
      if (marca !== "todas" && p.marca !== marca) return false;
      if (cor !== "todas" && !p.variacoes.some((v) => v.nome_cor === cor)) return false;
      if (tamanho !== "todos" && !p.variacoes.some((v) => v.tamanho === tamanho)) return false;
      if (min !== null && p.preco < min) return false;
      if (max !== null && p.preco > max) return false;
      const esg = isEsgotado(p);
      if (status === "ativos" && (!p.ativo || esg)) return false;
      if (status === "inativos" && p.ativo) return false;
      if (status === "esgotados" && !esg) return false;
      if (status === "em-estoque" && esg) return false;
      if (destaque === "novidade" && !p.novidade) return false;
      if (destaque === "promocao" && !p.promocao) return false;
      return true;
    });
    const totalEstoque = (p: (typeof produtos)[number]) =>
      p.variacoes.reduce((a, v) => a + v.quantidade_estoque, 0);
    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case "nome-asc": return a.nome.localeCompare(b.nome);
        case "nome-desc": return b.nome.localeCompare(a.nome);
        case "menor-preco": return a.preco - b.preco;
        case "maior-preco": return b.preco - a.preco;
        case "menor-estoque": return totalEstoque(a) - totalEstoque(b);
        case "maior-estoque": return totalEstoque(b) - totalEstoque(a);
        case "antigos": return 0; // already sorted desc; reverse below
        default: return 0;
      }
    });
    if (sort === "antigos") sorted.reverse();
    return sorted;
  }, [produtos, q, categoriaId, marca, cor, tamanho, status, destaque, precoMin, precoMax, sort]);

  const del = async (id: string) => {
    const alvo = produtos.find((p) => p.id === id);
    if (!confirm("Excluir este produto? Esta ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("produtos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Produto excluído.");
    await logAudit({
      acao: "excluir",
      entidade: "produto",
      entidade_id: id,
      descricao: `Excluiu produto ${alvo?.nome ?? id}`,
      detalhes: alvo ? { nome: alvo.nome, marca: alvo.marca, preco: alvo.preco } : undefined,
    });
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
          className="btn-shine group inline-flex items-center gap-2.5 self-start rounded-full bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-lg shadow-primary/25 ring-2 ring-primary/20 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/30 sm:self-end"
        >
          <span className="grid h-6 w-6 place-items-center rounded-full bg-primary-foreground/20">
            <Plus className="h-4 w-4" />
          </span>
          Adicionar novo produto
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
        <div className="flex flex-col gap-3 border-b border-border p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nome ou marca…"
                className="w-full rounded-full border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-foreground"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              >
                <option value="recentes">Mais recentes</option>
                <option value="antigos">Mais antigos</option>
                <option value="nome-asc">Nome (A–Z)</option>
                <option value="nome-desc">Nome (Z–A)</option>
                <option value="menor-preco">Menor preço</option>
                <option value="maior-preco">Maior preço</option>
                <option value="maior-estoque">Maior estoque</option>
                <option value="menor-estoque">Menor estoque</option>
              </select>
              <button
                onClick={() => setShowFilters((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-3 py-2 text-sm hover:bg-accent"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
                {activeCount > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-foreground px-1.5 text-[10px] font-bold text-background">
                    {activeCount}
                  </span>
                )}
              </button>
              <p className="hidden text-xs text-muted-foreground sm:block">
                {filtered.length}/{produtos.length}
              </p>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              >
                <option value="todas">Todas categorias</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              <select
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              >
                <option value="todas">Todas marcas</option>
                {marcas.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              >
                <option value="todas">Todas cores</option>
                {cores.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={tamanho}
                onChange={(e) => setTamanho(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              >
                <option value="todos">Todos tamanhos</option>
                {tamanhos.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              >
                <option value="todos">Qualquer status</option>
                <option value="ativos">Ativos</option>
                <option value="inativos">Inativos</option>
                <option value="em-estoque">Em estoque</option>
                <option value="esgotados">Esgotados</option>
              </select>
              <select
                value={destaque}
                onChange={(e) => setDestaque(e.target.value as DestaqueFilter)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              >
                <option value="todos">Sem destaque</option>
                <option value="novidade">Novidades</option>
                <option value="promocao">Em promoção</option>
              </select>
              <div className="col-span-2 flex items-center gap-2 sm:col-span-3 lg:col-span-2">
                <div className="flex flex-1 items-center rounded-lg border border-input bg-background px-2">
                  <span className="text-xs text-muted-foreground">R$</span>
                  <input
                    type="number"
                    min={0}
                    inputMode="decimal"
                    placeholder="Mín"
                    value={precoMin}
                    onChange={(e) => setPrecoMin(e.target.value)}
                    className="w-full bg-transparent px-1.5 py-1.5 text-sm outline-none"
                  />
                </div>
                <span className="text-muted-foreground">—</span>
                <div className="flex flex-1 items-center rounded-lg border border-input bg-background px-2">
                  <span className="text-xs text-muted-foreground">R$</span>
                  <input
                    type="number"
                    min={0}
                    inputMode="decimal"
                    placeholder="Máx"
                    value={precoMax}
                    onChange={(e) => setPrecoMax(e.target.value)}
                    className="w-full bg-transparent px-1.5 py-1.5 text-sm outline-none"
                  />
                </div>
              </div>
              {activeCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground sm:col-span-3 lg:col-span-1"
                >
                  <X className="h-4 w-4" /> Limpar filtros
                </button>
              )}
            </div>
          )}
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
                            to="/produto/$id"
                            params={{ id: p.id }}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            aria-label="Visualizar"
                            title="Visualizar produto"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            to="/admin/produtos/$id"
                            params={{ id: p.id }}
                            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            aria-label="Editar"
                            title="Editar"
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
