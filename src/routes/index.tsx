import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartDrawer } from "@/components/cart-drawer";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { FilterSidebar, defaultFilters, type Filters } from "@/components/filter-sidebar";
import { listCategorias, listProdutos } from "@/lib/products";
import { z } from "zod";
import { PackageSearch } from "lucide-react";
import birkenDubai from "@/assets/birken_dubai.jpg.asset.json";
import birkenPremium from "@/assets/birken_premium.jpg.asset.json";

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

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero band */}
      <section className="relative overflow-hidden border-b border-border bg-card">
        {/* Decorative images behind the hero area */}
        {!q && !activeSlug && heading === "Coleção" && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 top-0 -z-0 flex w-full items-center justify-end pr-0 opacity-15 md:w-2/3 md:opacity-20 lg:opacity-25"
          >
            <img
              src={birkenDubai.url}
              alt=""
              className="h-56 w-56 translate-x-12 translate-y-4 rounded-full object-cover shadow-xl md:h-80 md:w-80 md:translate-x-16 lg:h-96 lg:w-96"
            />
            <img
              src={birkenPremium.url}
              alt=""
              className="h-48 w-48 -translate-x-8 translate-y-16 rounded-full object-cover shadow-xl md:h-64 md:w-64 md:translate-y-20 lg:h-80 lg:w-80"
            />
          </span>
        )}
        <div className="relative mx-auto max-w-7xl px-4 py-8 md:py-12">
          <div className="relative flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
            <span className="h-px w-6 bg-primary" />
            {q ? "Busca" : activeSlug ? "Categoria" : "Nova temporada"}
          </div>
          <h1 className="relative mt-3 font-display text-3xl font-extrabold leading-[1.05] tracking-tight text-foreground md:text-5xl">
            {heading}
          </h1>
          <p className="relative mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            {subheading}
          </p>
        </div>
      </section>


      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 md:grid-cols-[240px_1fr] md:gap-10 md:py-12 lg:grid-cols-[260px_1fr]">
        <FilterSidebar
          categorias={categorias}
          filters={filters}
          onChange={setFilters}
        />
        <section>
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
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-24 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10">
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
                className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
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

