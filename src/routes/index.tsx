import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartDrawer } from "@/components/cart-drawer";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { FilterSidebar, defaultFilters, type Filters } from "@/components/filter-sidebar";
import { getPromoInfo, listCategorias, listProdutos } from "@/lib/products";
import { z } from "zod";
import { PackageSearch } from "lucide-react";

const searchSchema = z.object({
  cat: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "ACHAEBUSCA — Moda masculina urbana" },
      {
        name: "description",
        content:
          "Camisas, bermudas, calças e acessórios selecionados. Peça direto pelo WhatsApp.",
      },
      { property: "og:title", content: "ACHAEBUSCA — Catálogo" },
      { property: "og:description", content: "Moda urbana, atendimento próximo, pedidos via WhatsApp." },
    ],
  }),
  component: Home,
});

function Home() {
  const { cat, q } = Route.useSearch();
  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: listCategorias,
  });
  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ["produtos"],
    queryFn: listProdutos,
  });

  const [filters, setFilters] = useState<Filters>({
    ...defaultFilters,
    categoriaSlug: cat ?? null,
    q: q ?? "",
  });

  const catBySlug = useMemo(
    () => Object.fromEntries(categorias.map((c) => [c.slug, c.id])),
    [categorias],
  );
  const catBySlugName = useMemo(
    () => Object.fromEntries(categorias.map((c) => [c.slug, c.nome])),
    [categorias],
  );

  const filtered = useMemo(() => {
    let list = produtos.filter((p) => p.ativo);
    const query = (q ?? filters.q).trim().toLowerCase();
    if (query) list = list.filter((p) => p.nome.toLowerCase().includes(query));
    const slug = cat ?? filters.categoriaSlug;
    if (slug && catBySlug[slug])
      list = list.filter((p) => p.categoria_id === catBySlug[slug]);
    if (filters.novidades) list = list.filter((p) => p.novidade);
    if (filters.promocao) list = list.filter((p) => p.promocao);
    list = list.filter((p) => p.preco <= filters.precoMax);
    switch (filters.ordem) {
      case "menor-preco":
        list = [...list].sort((a, b) => a.preco - b.preco);
        break;
      case "maior-preco":
        list = [...list].sort((a, b) => b.preco - a.preco);
        break;
      case "nome":
        list = [...list].sort((a, b) => a.nome.localeCompare(b.nome));
        break;
    }
    return list;
  }, [produtos, filters, cat, q, catBySlug]);

  const activeSlug = cat ?? filters.categoriaSlug;
  const heading = q
    ? `Resultados para "${q}"`
    : activeSlug && catBySlugName[activeSlug]
    ? catBySlugName[activeSlug]
    : "Coleção";
  const subheading = q
    ? `${filtered.length} peça${filtered.length === 1 ? "" : "s"} encontrada${filtered.length === 1 ? "" : "s"}`
    : "Peças selecionadas para o dia a dia";

  const activeChips: Array<{ key: string; label: string; onClear: () => void }> = [];
  if (activeSlug && catBySlugName[activeSlug])
    activeChips.push({
      key: "cat",
      label: catBySlugName[activeSlug],
      onClear: () => setFilters({ ...filters, categoriaSlug: null }),
    });
  if (filters.novidades)
    activeChips.push({ key: "nov", label: "Novidades", onClear: () => setFilters({ ...filters, novidades: false }) });
  if (filters.promocao)
    activeChips.push({ key: "promo", label: "Em promoção", onClear: () => setFilters({ ...filters, promocao: false }) });
  if (filters.precoMax < 500 || filters.precoMin > 0)
    activeChips.push({
      key: "preco",
      label: `Até ${filtered.length && ""}R$ ${filters.precoMax}`,
      onClear: () => setFilters({ ...filters, precoMin: 0, precoMax: 500 }),
    });

  const promocoes = useMemo(
    () =>
      produtos
        .filter((p) => p.ativo && getPromoInfo(p).ativa)
        .sort((a, b) => getPromoInfo(b).percentual - getPromoInfo(a).percentual)
        .slice(0, 8),
    [produtos],
  );

  const proximoFim = useMemo(() => {
    const datas = promocoes
      .map((p) => getPromoInfo(p).validoAte?.getTime() ?? Infinity)
      .filter((t) => Number.isFinite(t));
    if (datas.length === 0) return null;
    return new Date(Math.min(...datas));
  }, [promocoes]);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!proximoFim) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [proximoFim]);

  const countdown = useMemo(() => {
    if (!proximoFim) return null;
    const diff = Math.max(0, proximoFim.getTime() - now);
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1000);
    return { h, m, s };
  }, [proximoFim, now]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 md:grid-cols-[240px_1fr] md:gap-10 md:py-12 lg:grid-cols-[260px_1fr]">
        <FilterSidebar
          categorias={categorias}
          filters={filters}
          onChange={setFilters}
        />
        <section>
          {/* Promoções do dia — faixa simples integrada */}
          {promocoes.length > 0 && !filters.promocao && !q && !activeSlug && (
            <div className="mb-10">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">Promoções do dia</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Ofertas válidas por tempo limitado.</p>
                </div>
                <Link
                  to="/"
                  search={{ promocao: "true" }}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  Ver todas
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {promocoes.slice(0, 4).map((p) => (
                  <ProductCard key={p.id} p={p} />
                ))}
              </div>
            </div>
          )}

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {isLoading
                ? "Carregando…"
                : (
                    <>
                      <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
                      produto{filtered.length === 1 ? "" : "s"}
                    </>
                  )}
            </p>
            {activeChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {activeChips.map((c) => (
                  <button
                    key={c.key}
                    onClick={c.onClear}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    {c.label}
                    <span className="text-muted-foreground group-hover:text-primary">×</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-24 text-center shadow-soft">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 ring-4 ring-primary/5">
                <PackageSearch className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mt-5 font-display text-lg font-bold">
                Nenhum produto encontrado
              </h3>
              <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                Tente ajustar os filtros ou buscar por outro termo.
              </p>
              <button
                onClick={() => setFilters(defaultFilters)}
                className="btn-shine mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-premium transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">
              {filtered.map((p, idx) => (
                <div
                  key={p.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${Math.min(idx * 40, 400)}ms` }}
                >
                  <ProductCard p={p} />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
      <CartDrawer />
    </div>
  );
}



