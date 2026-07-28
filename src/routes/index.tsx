import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartDrawer } from "@/components/cart-drawer";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { FilterSidebar, defaultFilters, type Filters } from "@/components/filter-sidebar";
import { getPromoInfo, listCategorias, listProdutos } from "@/lib/products";
import { z } from "zod";
import { Flame, PackageSearch, Clock, ArrowRight, Sparkles, Tag, Zap } from "lucide-react";
import { brl } from "@/lib/format";
import { getImageUrl } from "@/lib/storage";

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

      {/* Promoções do dia — hero de ofertas relâmpago */}
      {promocoes.length > 0 && (
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-[#e04a00]">
          {/* Decorativos de fundo */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-black/10 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-8 md:py-12">
            {/* Cabeçalho */}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-foreground backdrop-blur-sm">
                  <Zap className="h-3 w-3 fill-current" />
                  Ofertas relâmpago
                </div>
                <div>
                  <h1 className="font-display text-3xl font-black leading-none tracking-tight text-primary-foreground md:text-4xl lg:text-5xl">
                    Promoções do dia
                  </h1>
                  <p className="mt-2 max-w-md text-sm text-primary-foreground/85 md:text-base">
                    Selecionadas a dedo, com desconto real. Aproveite antes que acabe.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                {countdown && (
                  <div className="flex items-center gap-2.5 rounded-2xl border border-primary-foreground/25 bg-primary-foreground/15 px-4 py-2.5 text-primary-foreground shadow-lg backdrop-blur-md">
                    <Clock className="h-4 w-4 animate-pulse" />
                    <div className="flex items-baseline gap-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/70">Termina em</span>
                      <div className="flex items-center gap-1 font-mono text-lg font-bold tabular-nums leading-none">
                        <span className="rounded bg-primary-foreground/15 px-1.5 py-1">{String(countdown.h).padStart(2, "0")}</span>
                        <span className="opacity-60">:</span>
                        <span className="rounded bg-primary-foreground/15 px-1.5 py-1">{String(countdown.m).padStart(2, "0")}</span>
                        <span className="opacity-60">:</span>
                        <span className="rounded bg-primary-foreground/15 px-1.5 py-1">{String(countdown.s).padStart(2, "0")}</span>
                      </div>
                    </div>
                  </div>
                )}
                <Link
                  to="/"
                  search={{ promocao: "true" }}
                  className="btn-shine group inline-flex items-center gap-2 rounded-full bg-primary-foreground px-5 py-2.5 text-sm font-bold text-primary shadow-premium transition-transform hover:scale-[1.03] active:scale-[0.98]"
                >
                  Ver todas as ofertas
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Grid de destaque: 1 hero + 3 laterais */}
            <div className="mt-8 grid gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
              {promocoes[0] && <FeaturedPromoCard produto={promocoes[0]} />}
              <div className="grid grid-cols-2 gap-4 md:col-span-2 md:grid-cols-2 lg:col-span-3 lg:grid-cols-3">
                {promocoes.slice(1, 7).map((p) => (
                  <div key={p.id} className="group relative rounded-2xl bg-background p-2.5 shadow-premium ring-1 ring-black/5 transition-transform hover:-translate-y-1">
                    <span className="absolute -top-2 -right-2 z-10 inline-flex items-center gap-0.5 rounded-full bg-navy px-2 py-1 text-[10px] font-black tabular-nums text-navy-foreground shadow-lg">
                      -{getPromoInfo(p).percentual}%
                    </span>
                    <ProductCard p={p} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}



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

