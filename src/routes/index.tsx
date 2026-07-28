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

function FeaturedPromoCard({ produto }: { produto: ReturnType<typeof getPromoInfo> extends infer _ ? Parameters<typeof ProductCard>[0]["p"] : never }) {
  const promo = getPromoInfo(produto);
  const principal =
    produto.imagens.find((i) => i.principal) ??
    [...produto.imagens].sort((a, b) => a.ordem - b.ordem)[0];
  const [img, setImg] = useState<string>("");
  useEffect(() => {
    if (principal) getImageUrl(principal.storage_path).then(setImg);
  }, [principal]);

  return (
    <Link
      to="/produto/$id"
      params={{ id: produto.id }}
      className="group relative flex flex-col overflow-hidden rounded-3xl bg-background shadow-premium ring-1 ring-black/5 transition-transform hover:-translate-y-1 md:col-span-1 lg:col-span-1"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-primary/10">
        {img ? (
          <img
            src={img}
            alt={produto.nome}
            className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.07]"
          />
        ) : (
          <div className="skeleton h-full w-full" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-navy px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-navy-foreground shadow-lg">
            <Sparkles className="h-3 w-3" />
            Destaque
          </span>
        </div>

        <div className="absolute right-3 top-3">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-primary px-3 py-2 text-primary-foreground shadow-2xl ring-2 ring-primary-foreground/30">
            <span className="text-[9px] font-bold uppercase tracking-wider leading-none opacity-90">Off</span>
            <span className="font-display text-2xl font-black leading-none tabular-nums">
              {promo.percentual}%
            </span>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <h3 className="line-clamp-2 font-display text-base font-bold leading-tight md:text-lg">
            {produto.nome}
          </h3>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-2xl font-black tabular-nums md:text-3xl">
              {brl(promo.precoFinal)}
            </span>
            <span className="text-xs font-medium tabular-nums text-white/70 line-through">
              {brl(promo.precoOriginal)}
            </span>
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-primary shadow-md">
            <Tag className="h-3.5 w-3.5" />
            Aproveitar oferta
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}


