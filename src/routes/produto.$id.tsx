import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartDrawer } from "@/components/cart-drawer";
import { getProduto, isEsgotado } from "@/lib/products";
import { getImageUrl } from "@/lib/storage";
import { brl } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { Plus, Minus, ShoppingCart, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/produto/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Produto — ACHAEBUSCA` },
      { name: "description", content: `Detalhes do produto ${params.id} na ACHAEBUSCA.` },
    ],
  }),
  component: ProductPage,
  errorComponent: ({ error }) => (
    <div className="p-10 text-center text-sm text-muted-foreground">
      {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-10 text-center">Produto não encontrado.</div>
  ),
});

function ProductPage() {
  const { id } = Route.useParams();
  const { data: p, isLoading } = useQuery({
    queryKey: ["produto", id],
    queryFn: () => getProduto(id),
  });
  const { add, setOpen } = useCart();

  const [imgs, setImgs] = useState<string[]>([]);
  const [mainIdx, setMainIdx] = useState(0);
  const [qtys, setQtys] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!p) return;
    const paths = [...p.imagens]
      .sort((a, b) => (b.principal ? 1 : 0) - (a.principal ? 1 : 0) || a.ordem - b.ordem)
      .map((i) => i.storage_path);
    Promise.all(paths.map(getImageUrl)).then(setImgs);
  }, [p]);

  const matriz = useMemo(() => {
    if (!p) return { cores: [], tamanhos: [] as string[] };
    const coresMap = new Map<string, { nome: string; hex: string }>();
    const tamanhos = new Set<string>();
    for (const v of p.variacoes) {
      coresMap.set(v.nome_cor, { nome: v.nome_cor, hex: v.hex_cor });
      tamanhos.add(v.tamanho);
    }
    const order = ["PP", "P", "M", "G", "GG", "XG"];
    const tams = Array.from(tamanhos).sort(
      (a, b) => (order.indexOf(a) + 100) - (order.indexOf(b) + 100) || a.localeCompare(b),
    );
    return { cores: Array.from(coresMap.values()), tamanhos: tams };
  }, [p]);

  const getVar = (cor: string, tam: string) =>
    p?.variacoes.find((v) => v.nome_cor === cor && v.tamanho === tam);

  const setQ = (k: string, q: number) =>
    setQtys((prev) => ({ ...prev, [k]: Math.max(0, q) }));

  const subtotal = useMemo(() => {
    if (!p) return 0;
    return Object.entries(qtys).reduce((s, [, q]) => s + q * p.preco, 0);
  }, [qtys, p]);

  const totalItens = Object.values(qtys).reduce((s, q) => s + q, 0);

  const addAoCarrinho = () => {
    if (!p || totalItens === 0) {
      toast.error("Selecione ao menos uma variação.");
      return;
    }
    for (const [key, q] of Object.entries(qtys)) {
      if (q <= 0) continue;
      const [cor, tam] = key.split("||");
      const v = getVar(cor, tam);
      if (!v) continue;
      add(
        {
          produtoId: p.id,
          nome: p.nome,
          cor,
          hexCor: v.hex_cor,
          tamanho: tam,
          preco: p.preco,
        },
        q,
      );
    }
    setQtys({});
    setOpen(true);
    toast.success("Adicionado ao carrinho!");
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Continuar comprando
        </Link>

        {isLoading || !p ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[80px_1fr_1fr]">
            <div className="order-2 flex flex-row gap-2 md:order-1 md:flex-col">
              {imgs.map((u, i) => (
                <button
                  key={i}
                  onClick={() => setMainIdx(i)}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-md border ${
                    i === mainIdx ? "border-foreground" : "border-border"
                  }`}
                >
                  <img src={u} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>

            <div className="order-1 md:order-2">
              <div className="relative aspect-square overflow-hidden rounded-md border border-border bg-muted">
                {imgs[mainIdx] ? (
                  <img
                    src={imgs[mainIdx]}
                    alt={p.nome}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">
                    sem imagem
                  </div>
                )}
                {isEsgotado(p) && (
                  <div className="absolute inset-x-0 bottom-0 bg-destructive py-1.5 text-center text-xs font-bold tracking-wider text-destructive-foreground">
                    ESGOTADO
                  </div>
                )}
              </div>
            </div>

            <div className="order-3 space-y-5">
              <div>
                <h1 className="text-xl font-semibold uppercase tracking-wide">
                  {p.nome}
                </h1>
                {p.descricao && (
                  <p className="mt-2 text-sm text-muted-foreground">{p.descricao}</p>
                )}
                <p className="mt-3 text-2xl font-bold">{brl(p.preco)}</p>
              </div>

              {matriz.cores.length === 0 ? (
                <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Este produto ainda não possui variações cadastradas.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left"></th>
                        {matriz.tamanhos.map((t) => (
                          <th key={t} className="p-2 text-center font-semibold">
                            {t}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matriz.cores.map((c) => (
                        <tr key={c.nome} className="border-t border-border">
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-6 w-6 rounded-full border border-border"
                                style={{ backgroundColor: c.hex }}
                              />
                              <span className="text-xs">{c.nome}</span>
                            </div>
                          </td>
                          {matriz.tamanhos.map((t) => {
                            const v = getVar(c.nome, t);
                            const key = `${c.nome}||${t}`;
                            const q = qtys[key] ?? 0;
                            const disponivel = v && v.quantidade_estoque > 0;
                            if (!v)
                              return (
                                <td key={t} className="bg-muted/40 p-2 text-center text-muted-foreground">
                                  —
                                </td>
                              );
                            if (!disponivel)
                              return (
                                <td key={t} className="p-2 text-center text-xs text-destructive">
                                  Esgotado
                                </td>
                              );
                            return (
                              <td key={t} className="p-2">
                                {q === 0 ? (
                                  <button
                                    onClick={() => setQ(key, 1)}
                                    className="mx-auto flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-accent"
                                    aria-label="Adicionar"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <div className="mx-auto flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => setQ(key, q - 1)}
                                      className="rounded-md border border-border p-1 hover:bg-accent"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="w-6 text-center">{q}</span>
                                    <button
                                      onClick={() =>
                                        setQ(key, Math.min(v.quantidade_estoque, q + 1))
                                      }
                                      className="rounded-md border border-border p-1 hover:bg-accent"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex items-center justify-between rounded-md border border-border p-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {totalItens} pç{totalItens === 1 ? "" : "s"}
                  </p>
                  <p className="text-lg font-bold">{brl(subtotal)}</p>
                </div>
                <button
                  onClick={addAoCarrinho}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  <ShoppingCart className="h-4 w-4" /> Adicionar ao carrinho
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
      <CartDrawer />
    </div>
  );
}
