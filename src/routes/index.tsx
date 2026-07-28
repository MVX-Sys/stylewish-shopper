import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartDrawer } from "@/components/cart-drawer";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { FilterSidebar, defaultFilters, type Filters } from "@/components/filter-sidebar";
import { listCategorias, listProdutos, getPromoInfo } from "@/lib/products";
import { z } from "zod";
import {
  PackageSearch,
  Shirt,
  Footprints,
  ShoppingBag,
  Watch,
  Sparkles,
  Tag,
  Zap,
  Clock,
  Truck,
  ShieldCheck,
  MessageCircle,
  ChevronRight,
  Package,
} from "lucide-react";

const searchSchema = z.object({
  cat: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "ACHAEBUSCA — Atacado de moda e calçados" },
      {
        name: "description",
        content:
          "Ofertas relâmpago, novidades e coleções completas em roupas e calçados. Peça direto pelo WhatsApp.",
      },
      { property: "og:title", content: "ACHAEBUSCA — Atacado" },
      {
        property: "og:description",
        content: "Ofertas relâmpago e coleções selecionadas. Atendimento pelo WhatsApp.",
      },
    ],
  }),
  component: Home,
});

const categoryIcons: Record<string, typeof Shirt> = {
  camisas: Shirt,
  camisetas: Shirt,
  bermudas: Shirt,
  calcas: Shirt,
  jaquetas: Shirt,
  tenis: Footprints,
  sandalias: Footprints,
  sapatos: Footprints,
  chinelos: Footprints,
  botas: Footprints,
  sapatenis: Footprints,
  acessorios: Watch,
  bolsas: ShoppingBag,
};

function iconFor(slug: string) {
  return categoryIcons[slug] ?? Package;
}

function useCountdown(targetMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, targetMs - now);
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return { h, m, s };
}

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

  const showLanding = !q && !cat;

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

  const activos = useMemo(() => produtos.filter((p) => p.ativo), [produtos]);
  const emPromocao = useMemo(
    () => activos.filter((p) => getPromoInfo(p).ativa).slice(0, 8),
    [activos],
  );
  const novidades = useMemo(
    () => activos.filter((p) => p.novidade).slice(0, 8),
    [activos],
  );
  const destaques = useMemo(() => activos.slice(0, 10), [activos]);

  // Countdown: end of today
  const endOfDay = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  }, []);
  const { h, m, s } = useCountdown(endOfDay);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {showLanding ? (
        <LandingView
          categorias={categorias}
          emPromocao={emPromocao}
          novidades={novidades}
          destaques={destaques}
          isLoading={isLoading}
          countdown={{ h, m, s }}
        />
      ) : (
        <CatalogView
          categorias={categorias}
          filtered={filtered}
          filters={filters}
          setFilters={setFilters}
          isLoading={isLoading}
          q={q}
          cat={cat}
          catBySlugName={catBySlugName}
        />
      )}

      <SiteFooter />
      <CartDrawer />
    </div>
  );
}

/* ---------------- Landing view ---------------- */

function LandingView({
  categorias,
  emPromocao,
  novidades,
  destaques,
  isLoading,
  countdown,
}: {
  categorias: { id: string; nome: string; slug: string }[];
  emPromocao: React.ComponentProps<typeof ProductCard>["p"][];
  novidades: React.ComponentProps<typeof ProductCard>["p"][];
  destaques: React.ComponentProps<typeof ProductCard>["p"][];
  isLoading: boolean;
  countdown: { h: number; m: number; s: number };
}) {
  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <>
      {/* Category tiles */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-3 py-5 sm:px-4 sm:py-7">
          <div
            className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] sm:gap-5 [&::-webkit-scrollbar]:hidden"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {categorias.map((c) => {
              const Icon = iconFor(c.slug);
              return (
                <Link
                  key={c.id}
                  to="/"
                  search={{ cat: c.slug } as never}
                  className="group flex w-20 shrink-0 flex-col items-center gap-2 sm:w-24"
                >
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md transition-transform group-hover:-translate-y-0.5 group-hover:shadow-lg sm:h-20 sm:w-20">
                    <Icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2} />
                  </div>
                  <span className="line-clamp-2 text-center text-[11px] font-semibold leading-tight text-foreground sm:text-xs">
                    {c.nome}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Promo banner strip */}
      <section className="bg-primary/5">
        <div className="mx-auto grid max-w-7xl gap-3 px-3 py-5 sm:grid-cols-2 sm:gap-4 sm:px-4 lg:grid-cols-4">
          {[
            { icon: Truck, title: "Frete combinado", desc: "Fechamos tudo pelo WhatsApp" },
            { icon: Tag, title: "Preço de atacado", desc: "Descontos por volume" },
            { icon: ShieldCheck, title: "Produto conferido", desc: "Qualidade garantida" },
            { icon: MessageCircle, title: "Atendimento direto", desc: "Fale com um consultor" },
          ].map((b) => (
            <div
              key={b.title}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <b.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">{b.title}</p>
                <p className="truncate text-xs text-muted-foreground">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Flash offers */}
      {emPromocao.length > 0 && (
        <section className="mx-auto max-w-7xl px-3 py-8 sm:px-4 sm:py-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
                Melhores Ofertas
              </h2>
              <Zap className="h-6 w-6 fill-primary text-primary" />
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground sm:text-sm">
              <Clock className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline">As ofertas se encerram em:</span>
              <div className="flex items-center gap-1 font-display tabular-nums">
                <span className="rounded-md border-2 border-primary bg-card px-2 py-1 text-primary">
                  {pad(countdown.h)}H
                </span>
                <span className="rounded-md border-2 border-primary bg-card px-2 py-1 text-primary">
                  {pad(countdown.m)}M
                </span>
                <span className="rounded-md border-2 border-primary bg-card px-2 py-1 text-primary">
                  {pad(countdown.s)}S
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {emPromocao.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      {/* Novidades */}
      {novidades.length > 0 && (
        <section className="bg-card">
          <div className="mx-auto max-w-7xl px-3 py-8 sm:px-4 sm:py-10">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
                  Novidades da coleção
                </h2>
              </div>
              <Link
                to="/colecao"
                className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:inline-flex"
              >
                Ver todas <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              {novidades.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Destaques */}
      <section className="mx-auto max-w-7xl px-3 py-8 sm:px-4 sm:py-12">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
            Selecionados para você
          </h2>
          <Link
            to="/colecao"
            className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:inline-flex"
          >
            Ver catálogo <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {destaques.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

/* ---------------- Catalog view (previous behavior) ---------------- */

function CatalogView({
  categorias,
  filtered,
  filters,
  setFilters,
  isLoading,
  q,
  cat,
  catBySlugName,
}: {
  categorias: { id: string; nome: string; slug: string; ordem: number }[];
  filtered: React.ComponentProps<typeof ProductCard>["p"][];
  filters: Filters;
  setFilters: (f: Filters) => void;
  isLoading: boolean;
  q: string | undefined;
  cat: string | undefined;
  catBySlugName: Record<string, string>;
}) {
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

  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-card">
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
        <FilterSidebar categorias={categorias} filters={filters} onChange={setFilters} />
        <section>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {isLoading ? (
                "Carregando…"
              ) : (
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
              <h3 className="mt-5 font-display text-lg font-bold">Nenhum produto encontrado</h3>
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
    </>
  );
}
