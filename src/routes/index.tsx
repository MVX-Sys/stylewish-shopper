import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartDrawer } from "@/components/cart-drawer";
import { ProductCard } from "@/components/product-card";
import { listCategoriasFn, listProdutosFn } from "@/lib/products.functions";
import { isEsgotado, type ProductListItem, type Categoria, getPromoInfo } from "@/lib/products";
import { getSiteConfig } from "@/lib/config-site";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["categorias"],
        queryFn: () => listCategoriasFn(),
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["produtos"],
        queryFn: () => listProdutosFn(),
      }),
    ]);
  },
  head: () => ({
    meta: [
      { title: "ACHAEBUSCA — Estilo Urbano Sem Limites" },
      {
        name: "description",
        content: "Acha & Busca Atacado - Moda masculina urbana premium.",
      },
      { property: "og:title", content: "ACHAEBUSCA — Home" },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: config } = useQuery({
    queryKey: ["site-config"],
    queryFn: getSiteConfig,
    staleTime: 1000 * 60 * 60, // Config changes rarely
  });
  const { data: categorias = [] } = useSuspenseQuery({
    queryKey: ["categorias"],
    queryFn: () => listCategoriasFn(),
    staleTime: 1000 * 60 * 30,
  });
  const { data: produtos = [] } = useSuspenseQuery({
    queryKey: ["produtos"],
    queryFn: () => listProdutosFn(),
    staleTime: 1000 * 60 * 10,
  });

  const novidades = useMemo(() => 
    produtos.filter((p: ProductListItem) => p.ativo && p.novidade && !isEsgotado(p)).slice(0, 4),
  [produtos]);

  const melhoresOfertas = useMemo(() => 
    produtos.filter((p: ProductListItem) => p.ativo && getPromoInfo(p).ativa && !isEsgotado(p))
      .sort((a: ProductListItem, b: ProductListItem) => getPromoInfo(b).percentual - getPromoInfo(a).percentual)
      .slice(0, 4),
  [produtos]);

  return (
    <div className="min-h-screen bg-background font-body">
      <SiteHeader />
      
      <HeroSection config={config} />

      <main>
        <ProductSection 
          title={["Novidades", ""]} 
          highlightIndex={0} 
          products={novidades} 
          emptyMessage="Não há novidades disponíveis no momento"
        />

        <ProductSection 
          title={["Melhores", "Ofertas"]} 
          highlightIndex={1} 
          products={melhoresOfertas} 
          isPromo
          emptyMessage="Não há ofertas disponíveis no momento"
        />

        <CategoriesSection categorias={categorias} />
      </main>

      <SiteFooter />
      <CartDrawer />
    </div>
  );
}

function HeroSection({ config }: { config?: any }) {
  const slides = config?.hero_slides || [];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <section className="relative h-[85vh] min-h-[600px] w-full overflow-hidden bg-navy">
      <AnimatePresence mode="wait">
        {slides.map((slide: any, index: number) => index === current && (
          <motion.div
            key={slide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            {/* Background Media */}
            <div className="absolute inset-0 z-0">
              {slide.tipo === 'video' && slide.media_url ? (
                <video 
                  src={slide.media_url} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="h-full w-full object-cover grayscale opacity-50"
                />
              ) : slide.tipo === 'image' && slide.media_url ? (
                <img 
                  src={slide.media_url} 
                  alt={slide.titulo} 
                  className="h-full w-full object-cover grayscale opacity-50"
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                />
              ) : (
                <div className="h-full w-full bg-navy">
                  <div 
                    className="absolute inset-0 opacity-40"
                    style={{
                      backgroundImage: "radial-gradient(circle at center, var(--primary), transparent 70%)"
                    }}
                  />
                </div>
              )}
              {/* Overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-navy/30 opacity-60" />
            </div>

            {/* Content */}
            <div className="relative z-20 flex h-full flex-col items-center justify-center px-4 text-center">
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="max-w-4xl font-display text-5xl font-black uppercase tracking-tighter text-white md:text-7xl lg:text-8xl"
              >
                {slide.titulo.split(' ').map((word: string, i: number, arr: string[]) => {
                  const isHighlighted = arr.length > 2 ? i >= arr.length - 2 : i === arr.length - 1;
                  return (
                    <span key={i} className={isHighlighted ? "text-primary" : ""}>
                      {word}{" "}
                    </span>
                  );
                })}
              </motion.h1>
              
              {slide.subtitulo && (
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="mt-6 max-w-2xl font-body text-lg font-medium text-white/90 md:text-xl lg:text-2xl"
                >
                  {slide.subtitulo}
                </motion.p>
              )}
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.8 }}
              >
                <Link
                  to="/produtos"
                  className="btn-shine mt-12 inline-block rounded-full bg-primary px-10 py-4 text-lg font-bold uppercase tracking-widest text-white shadow-premium transition-transform hover:scale-105 active:scale-95"
                >
                  Ver todos os produtos
                </Link>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Navigation Controls */}
      {slides.length > 1 && (
        <>
          <div className="absolute bottom-10 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3">
            {slides.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 transition-all duration-300 rounded-full ${i === current ? 'w-8 bg-primary' : 'w-2 bg-white/30 hover:bg-white/50'}`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={prevSlide}
            className="absolute left-6 top-1/2 z-30 -translate-y-1/2 rounded-full border border-white/20 bg-white/5 p-3 text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/40 md:left-10"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-6 top-1/2 z-30 -translate-y-1/2 rounded-full border border-white/20 bg-white/5 p-3 text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/40 md:right-10"
            aria-label="Próximo slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
    </section>
  );
}

interface ProductSectionProps {
  title: [string, string];
  highlightIndex: number;
  products: ProductListItem[];
  subtitle?: string;
  isPromo?: boolean;
  emptyMessage?: string;
}

function ProductSection({ title, highlightIndex, products, subtitle, isPromo, emptyMessage }: ProductSectionProps) {
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-12 text-center md:mb-16">
          <h2 className="font-display text-4xl font-black uppercase tracking-tighter md:text-5xl lg:text-6xl">
            {title.map((word, i) => (
              <span key={i} className={i === highlightIndex ? "text-primary" : ""}>
                {word}{" "}
              </span>
            ))}
          </h2>
          {subtitle && (
            <p className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>

        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
              {products.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>

            <div className="mt-16 text-center">
              <Link
                to="/produtos"
                className="inline-flex items-center gap-2 font-display text-sm font-black uppercase tracking-widest text-foreground transition-colors hover:text-primary"
              >
                {subtitle ? "Ver Catálogo Completo" : "Ver todos"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
            <p className="font-display text-lg font-medium text-muted-foreground italic">
              {emptyMessage}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function CategoriesSection({ categorias }: { categorias: Categoria[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth / 2 
        : scrollLeft + clientWidth / 2;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-24 md:py-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-12 flex items-end justify-between md:mb-16">
          <h2 className="font-display text-4xl font-black uppercase tracking-tighter md:text-5xl lg:text-6xl">
            Categorias
          </h2>
          
          <div className="hidden items-center gap-2 md:flex">
            <button 
              onClick={() => scroll('left')}
              className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card transition-colors hover:border-primary hover:text-primary"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card transition-colors hover:border-primary hover:text-primary"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
        >
          {categorias.map((cat) => (
            <Link
              key={cat.id}
              to="/produtos"
              search={{ cat: cat.slug }}
              className="group relative flex aspect-video min-w-[240px] flex-none snap-start items-center justify-center overflow-hidden rounded-2xl bg-muted transition-all hover:ring-2 hover:ring-primary md:min-w-[300px]"
            >
              <div className="absolute inset-0 z-0 bg-navy/40 transition-colors group-hover:bg-navy/20" />
              <span className="relative z-10 font-display text-xl font-black uppercase tracking-tighter text-white transition-transform group-hover:scale-110">
                {cat.nome}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}