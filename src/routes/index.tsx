import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listCategorias, listProdutos } from "@/lib/products";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductCard } from "@/components/product-card";
import { CartDrawer } from "@/components/cart-drawer";
import { ArrowRight, ShoppingBag, ChevronRight, MessageCircle, Instagram } from "lucide-react";
import { BRAND, WHATSAPP_NUMBER, WHATSAPP_DISPLAY } from "@/lib/config";
import { useMemo } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ACHAEBUSCA — Moda Masculina Premium" },
      {
        name: "description",
        content: "A melhor seleção de moda masculina urbana e atacado. Camisas, bermudas e acessórios premium.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: listCategorias,
  });

  const { data: produtos = [] } = useQuery({
    queryKey: ["produtos"],
    queryFn: listProdutos,
  });

  const featuredProducts = useMemo(() => {
    return produtos.filter(p => p.ativo).slice(0, 4);
  }, [produtos]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-primary selection:text-white">
      <SiteHeader />

      <main>
        {/* Hero Section */}
        <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden px-4 py-20 lg:py-32">
          {/* Ambient Background */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,85,0,0.15),transparent_70%)]" />
            <div className="absolute inset-0 bg-[#0A0A0A]/60" />
            <img 
              src="https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?auto=format&fit=crop&q=80&w=2070"
              alt="Hero Background"
              className="h-full w-full object-cover opacity-40 grayscale"
            />
          </div>

          <div className="relative z-10 mx-auto max-w-5xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">Nova Coleção Disponível</span>
            </div>
            
            <h1 className="font-display text-5xl font-black uppercase leading-[0.9] tracking-tighter text-white sm:text-7xl md:text-8xl lg:text-9xl">
              Estilo <span className="text-primary">Urbano</span><br />
              Sem Limites
            </h1>
            
            <p className="mx-auto mt-8 max-w-xl text-lg text-white/60 md:text-xl">
              Peças exclusivas desenhadas para quem não aceita o comum. Qualidade premium com a atitude que você procura.
            </p>

            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/produtos"
                className="group relative flex items-center gap-3 overflow-hidden rounded-full bg-primary px-10 py-5 text-sm font-black uppercase tracking-widest text-white transition-all hover:scale-105 hover:bg-primary/90 active:scale-95"
              >
                Ver todos os produtos
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-20">
            <div className="h-10 w-6 rounded-full border-2 border-white" />
          </div>
        </section>

        {/* Categories Section */}
        <section className="bg-[#0D0D0D] px-4 py-24 md:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 flex flex-col items-end justify-between gap-6 md:flex-row">
              <div className="max-w-xl">
                <h2 className="font-display text-4xl font-black uppercase tracking-tighter text-white sm:text-5xl lg:text-6xl">
                  Categorias em <span className="text-primary">Destaque</span>
                </h2>
              </div>
              <Link 
                to="/produtos" 
                className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white"
              >
                Explorar todas <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {categorias.map((cat) => (
                <Link
                  key={cat.id}
                  to="/produtos"
                  search={{ cat: cat.slug } as never}
                  className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#1A1A1A] ring-1 ring-white/5 transition-all hover:ring-primary/50"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-center">
                    <span className="block font-display text-sm font-black uppercase tracking-widest text-white transition-transform group-hover:-translate-y-1">
                      {cat.nome}
                    </span>
                  </div>
                  {/* Category placeholder images or icons could go here */}
                  <div className="flex h-full w-full items-center justify-center opacity-20 transition-opacity group-hover:opacity-40">
                    <ShoppingBag className="h-12 w-12" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className="px-4 py-24 md:py-32">
            <div className="mx-auto max-w-7xl">
              <div className="mb-16 text-center">
                <h2 className="font-display text-4xl font-black uppercase tracking-tighter text-white sm:text-5xl lg:text-6xl">
                  Os Mais <span className="text-primary">Vendidos</span>
                </h2>
                <p className="mt-4 text-white/40 uppercase tracking-[0.3em] text-[10px] font-bold">Best Sellers da Semana</p>
              </div>

              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                {featuredProducts.map((p) => (
                  <div key={p.id} className="dark">
                    <ProductCard p={p} />
                  </div>
                ))}
              </div>

              <div className="mt-20 text-center">
                <Link
                  to="/produtos"
                  className="inline-flex items-center gap-4 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md transition-all hover:bg-white/10"
                >
                  Ver Catálogo Completo
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Brand Philosophy Section */}
        <section className="relative overflow-hidden bg-primary px-4 py-24 md:py-32">
          <div className="absolute right-0 top-0 -translate-y-1/2 translate-x-1/2 opacity-10">
             <ShoppingBag className="h-[600px] w-[600px] text-white" />
          </div>
          
          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <h2 className="font-display text-4xl font-black uppercase leading-none tracking-tighter text-white sm:text-6xl md:text-7xl">
              Qualidade que você sente,<br />estilo que você vive.
            </h2>
            <div className="mt-12 flex flex-wrap justify-center gap-8 md:gap-16">
              {[
                { label: "Envio Rápido", sub: "Brasil todo" },
                { label: "Premium", sub: "Material selecionado" },
                { label: "Atacado", sub: "Melhores preços" }
              ].map(item => (
                <div key={item.label} className="text-center">
                  <div className="text-xl font-black uppercase tracking-tighter text-white">{item.label}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/60">{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Simple Footer for Home */}
      <footer className="border-t border-white/5 bg-[#0A0A0A] py-16 text-white/60">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center justify-between gap-10 md:flex-row md:gap-0">
            <div className="text-center md:text-left">
              <h3 className="font-display text-2xl font-black uppercase tracking-tighter text-white">
                acha<span className="text-primary">&</span>busca
              </h3>
              <p className="mt-2 text-sm max-w-xs">A moda urbana que define seu estilo. Qualidade e atitude em cada peça.</p>
            </div>
            
            <div className="flex flex-col items-center gap-6 md:flex-row md:gap-12">
              <div className="flex gap-6">
                <a href="#" className="hover:text-primary transition-colors"><Instagram className="h-5 w-5" /></a>
                <a href={`https://wa.me/${WHATSAPP_NUMBER}`} className="hover:text-primary transition-colors"><MessageCircle className="h-5 w-5" /></a>
              </div>
              <div className="text-center md:text-right">
                <div className="text-xs font-bold uppercase tracking-widest text-white">{WHATSAPP_DISPLAY}</div>
                <div className="mt-1 text-[10px] uppercase tracking-widest">Atendimento Personalizado</div>
              </div>
            </div>
          </div>
          <div className="mt-16 text-center text-[10px] uppercase tracking-[0.3em] font-bold border-t border-white/5 pt-8">
            © {new Date().getFullYear()} {BRAND}. FEITO PELA MVX SISTEMAS
          </div>
        </div>
      </footer>
      
      <CartDrawer />
    </div>
  );
}
