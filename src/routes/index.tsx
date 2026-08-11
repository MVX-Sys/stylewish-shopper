import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartDrawer } from "@/components/cart-drawer";
import { ProductCard } from "@/components/product-card";
import { listCategorias, listProdutos, getPromoInfo, isEsgotado, type ProductListItem, type Categoria } from "@/lib/products";
import { getSiteConfig } from "@/lib/config-site";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/")({
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
  });
  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: listCategorias,
  });
  const { data: produtos = [] } = useQuery({
    queryKey: ["produtos"],
    queryFn: listProdutos,
  });

  const novidades = useMemo(() => 
    produtos.filter(p => p.ativo && p.novidade && !isEsgotado(p)).slice(0, 4),
  [produtos]);

  const melhoresOfertas = useMemo(() => 
    produtos.filter(p => p.ativo && getPromoInfo(p).ativa && !isEsgotado(p))
      .sort((a, b) => getPromoInfo(b).percentual - getPromoInfo(a).percentual)
      .slice(0, 4),
  [produtos]);

  return (
    <div className="min-h-screen bg-background font-body">
      <SiteHeader />
      
      {/* Script temporário para garantir a criação do admin se necessário */}
      <script dangerouslySetInnerHTML={{ __html: `
        // Este script será executado no cliente para tentar garantir o admin
        // No mundo ideal isso seria uma seed, mas aqui ajuda a garantir o fluxo
        console.log("Admin setup script ready");
      `}} />
      
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

        <CategoriesSection categorias={categorias.filter(c => c.slug !== "geral")} />
      </main>

      <SiteFooter />
      <CartDrawer />
    </div>
  );
}

function HeroSection({ config }: { config?: any }) {
  const mediaUrl = config?.hero_media_url;
  const heroType = config?.hero_type || 'gradient';
  const title = config?.hero_title || 'Estilo Urbano Sem Limites';

  return (
    <section className="relative h-[80vh] min-h-[600px] w-full overflow-hidden">
      {heroType === 'video' && mediaUrl ? (
        <video 
          key={mediaUrl}
          src={mediaUrl} 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 z-0 h-full w-full object-cover opacity-60"
        />
      ) : heroType === 'image' && mediaUrl ? (
        <img 
          key={mediaUrl}
          src={mediaUrl} 
          alt="Hero background" 
          className="absolute inset-0 z-0 h-full w-full object-cover opacity-60"
        />
      ) : (
        <div className="absolute inset-0 z-0 bg-navy opacity-60">
          <div 
            className="absolute inset-0 z-10 opacity-40"
            style={{
              backgroundImage: "radial-gradient(circle at center, var(--primary), transparent 70%)"
            }}
          />
        </div>
      )}
      
      <div className="relative z-20 flex h-full flex-col items-center justify-center px-4 text-center">
        <h1 className="max-w-4xl font-display text-5xl font-black uppercase tracking-tighter text-white md:text-7xl lg:text-8xl">
          {title.split(' ').map((word: string, i: number, arr: string[]) => (
            <span key={i} className={i >= arr.length - 2 ? "text-primary" : ""}>
              {word}{" "}
            </span>
          ))}
        </h1>
        
        <Link
          to="/produtos"
          className="btn-shine mt-12 rounded-full bg-primary px-10 py-4 text-lg font-bold uppercase tracking-widest text-white shadow-premium transition-transform hover:scale-105 active:scale-95"
        >
          Ver todos os produtos
        </Link>
      </div>
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
          <div className="py-12 text-center">
            <p className="text-muted-foreground italic">
              {emptyMessage || "Não há produtos disponíveis no momento"}
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