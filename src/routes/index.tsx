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

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero band */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {q ? "Busca" : activeSlug ? "Categoria" : "Nova temporada"}
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
            {heading}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground md:text-base">
            {subheading}
          </p>
        </div>
      </section>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-8 md:grid-cols-[260px_1fr] md:py-10">
        <FilterSidebar
          categorias={categorias}
          filters={filters}
          onChange={setFilters}
        />
        <section>
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {isLoading
                ? "Carregando…"
                : `${filtered.length} produto${filtered.length === 1 ? "" : "s"}`}
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-20 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-muted">
                <PackageSearch className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">
                Nenhum produto encontrado
              </h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Tente ajustar os filtros ou buscar por outro termo.
              </p>
              <button
                onClick={() => setFilters(defaultFilters)}
                className="mt-5 rounded-full border border-border px-5 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
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
