import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartDrawer } from "@/components/cart-drawer";
import { ProductCard } from "@/components/product-card";
import { 
  listCategorias, 
  listProdutos, 
  getPromoInfo, 
  isEsgotado,
  type ProductListItem 
} from "@/lib/products";
import { brl } from "@/lib/format";
import { ArrowRight, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export const Route = createFileRoute("/")({
  component: Home,
});

function SectionTitle({ title, highlight }: { title: string; highlight: string }) {
  const parts = title.split(highlight);
  return (
    <h2 className="font-display text-3xl font-black uppercase tracking-tighter md:text-5xl">
      {parts[0]}
      <span className="text-primary">{highlight}</span>
      {parts[1]}
    </h2>
  );
}

function Home() {
  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: listCategorias,
  });
  const { data: produtos = [] } = useQuery({
    queryKey: ["produtos"],
    queryFn: listProdutos,
  });

  const novidades = useMemo(() => 
    produtos.filter(p => p.ativo && p.novidade && !isEsgotado(p)).slice(0, 4)
  , [produtos]);

  const ofertas = useMemo(() => 
    produtos
      .filter(p => p.ativo && getPromoInfo(p).ativa && !isEsgotado(p))
      .sort((a, b) => getPromoInfo(b).percentual - getPromoInfo(a).percentual)
      .slice(0, 4)
  , [produtos]);

  const maisVendidos = useMemo(() => 
    produtos.filter(p => p.ativo && !isEsgotado(p)).slice(0, 4)
  , [produtos]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* 1º HERO */}
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/60 z-10" />
          <div 
            className="absolute inset-0 opacity-40 grayscale"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1516251193007-45ef944ab0c6?q=80&w=2070&auto=format&fit=crop')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-primary)_0%,transparent_70%)] opacity-20 z-10" />
        </div>
        
        <div className="relative z-20 mx-auto max-w-7xl px-4 text-center">
          <h1 className="font-display text-5xl font-black uppercase tracking-tighter text-white md:text-8xl">
            Estilo Urbano <br />
            <span className="text-primary">Sem Limites</span>
          </h1>
          <div className="mt-10">
            <Link
              to="/produtos"
              className="btn-shine inline-flex items-center justify-center rounded-full bg-primary px-10 py-4 text-lg font-bold text-white shadow-premium transition-transform hover:scale-105"
            >
              Ver todos os produtos
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 2º NOVIDADES */}
      {novidades.length > 0 && (
        <section className="py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-12 text-center">
              <SectionTitle title="Novidades" highlight="Novidades" />
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:gap-x-6">
              {novidades.map(p => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
            <div className="mt-16 text-center">
              <Link
                to="/produtos"
                search={{ novidades: true } as any}
                className="inline-flex items-center font-bold text-primary hover:underline"
              >
                Ver todas as novidades <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 3º MELHORES OFERTAS */}
      {ofertas.length > 0 && (
        <section className="bg-primary/5 py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-12 text-center">
              <SectionTitle title="Melhores Ofertas" highlight="Ofertas" />
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:gap-x-6">
              {ofertas.map(p => {
                const promo = getPromoInfo(p);
                const diff = promo.validoAte ? Math.ceil((promo.validoAte.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                
                return (
                  <div key={p.id} className="flex flex-col">
                    <ProductCard p={p} />
                    <div className="mt-1 flex flex-col gap-0.5 px-0.5">
                      {diff !== null && diff > 0 && (
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                          Termina em {diff} {diff === 1 ? 'dia' : 'dias'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-16 text-center">
              <Link
                to="/produtos"
                search={{ promocao: true } as any}
                className="btn-shine inline-flex items-center justify-center rounded-full bg-foreground px-8 py-3 text-sm font-bold text-background shadow-lg transition-transform hover:scale-105"
              >
                Aproveitar Ofertas
                <Zap className="ml-2 h-4 w-4 fill-primary text-primary" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 4º MAIS VENDIDOS */}
      {maisVendidos.length > 0 && (
        <section className="py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-12 text-center">
              <SectionTitle title="Os Mais Vendidos" highlight="Mais Vendidos" />
              <p className="mt-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Best Sellers da Semana
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:gap-x-6">
              {maisVendidos.map(p => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
            <div className="mt-16 text-center">
              <Link
                to="/produtos"
                className="inline-flex items-center rounded-full border-2 border-primary px-8 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-white"
              >
                Ver Catálogo Completo
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 5º CATEGORIAS */}
      {categorias.length > 0 && (
        <section className="py-24 md:py-32 bg-foreground text-background">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-12 flex items-center justify-between">
              <h2 className="font-display text-3xl font-black uppercase tracking-tighter md:text-5xl">
                Cate<span className="text-primary">gorias</span>
              </h2>
            </div>
            
            <Carousel
              opts={{
                align: "start",
                dragFree: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {categorias.map((cat) => (
                  <CarouselItem key={cat.id} className="pl-4 basis-[45%] sm:basis-[30%] md:basis-[22%] lg:basis-[18%]">
                    <Link
                      to="/produtos"
                      search={{ cat: cat.slug } as any}
                      className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-white/10"
                    >
                      <div className="absolute inset-0 flex items-center justify-center p-4 text-center transition-colors group-hover:bg-primary/20">
                        <span className="font-display text-lg font-black uppercase tracking-tighter text-white sm:text-xl">
                          {cat.nome}
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 h-1 w-0 bg-primary transition-all duration-300 group-hover:w-full" />
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="hidden md:block">
                <CarouselPrevious className="left-[-20px] bg-primary text-white border-none hover:bg-primary/90" />
                <CarouselNext className="right-[-20px] bg-primary text-white border-none hover:bg-primary/90" />
              </div>
            </Carousel>
          </div>
        </section>
      )}

      <SiteFooter />
      <CartDrawer />
    </div>
  );
}
