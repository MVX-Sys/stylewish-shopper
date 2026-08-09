import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartDrawer } from "@/components/cart-drawer";
import { ArrowRight, Flame } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listProdutos, listCategorias } from "@/lib/products";
import { PromoHero } from "@/components/promo-hero";
import { ProductCard } from "@/components/product-card";
import { useMemo } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ACHAEBUSCA — Moda masculina urbana" },
      {
        name: "description",
        content:
          "Bem-vindo à ACHAEBUSCA. Confira nossa coleção exclusiva de moda urbana masculina.",
      },
      { property: "og:title", content: "ACHAEBUSCA — Bem-vindo" },
      { property: "og:description", content: "Moda urbana, atendimento próximo, pedidos via WhatsApp." },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: produtos = [] } = useQuery({
    queryKey: ["produtos"],
    queryFn: listProdutos,
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: listCategorias,
  });

  const promoProducts = useMemo(() => produtos.filter((p) => p.ativo && p.promocao).slice(0, 4), [produtos]);
  const latestProducts = useMemo(() => produtos.filter((p) => p.ativo).slice(0, 8), [produtos]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      
      <main className="flex-1 p-6 md:p-10 lg:p-12">
        <div className="max-w-7xl mx-auto space-y-16 md:space-y-24">
          {/* Hero Section */}
          <section className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-6xl font-display font-black text-foreground mb-6 leading-tight">
                ESTILO URBANO EM <span className="text-brand">CADA DETALHE</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-10 max-w-lg mx-auto">
                Descubra a nova coleção da acha&busca ATACADO. Peças exclusivas com a qualidade que você já conhece.
              </p>
              
              <Link
                to="/loja"
                className="inline-flex items-center gap-2 bg-brand text-brand-foreground px-8 py-4 rounded-full font-bold text-lg shadow-premium hover:scale-105 transition-all group"
              >
                Ver todos os produtos
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </section>

          {/* Categories Grid (Reference: image-46.png) */}
          <section className="space-y-8">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-2xl md:text-3xl font-display font-black">Categorias</h2>
                <p className="text-muted-foreground">Explore nossos departamentos</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categorias.slice(0, 4).map((cat) => (
                <Link
                  key={cat.id}
                  to="/loja"
                  search={{ cat: cat.slug }}
                  className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted"
                >
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors z-10" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-4 text-center">
                    <span className="text-white font-display font-black text-lg md:text-xl uppercase tracking-wider mb-4">
                      {cat.nome}
                    </span>
                    <div className="border border-white text-white px-6 py-2 rounded-sm text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      Confira
                    </div>
                  </div>
                  {/* Category Image Placeholder or specific logic if available */}
                  <div className="w-full h-full bg-navy/10 group-hover:scale-110 transition-transform duration-700" />
                </Link>
              ))}
            </div>
          </section>

          {/* Promo Section (Reference: image-47.png) */}
          {promoProducts.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Flame className="w-6 h-6 text-primary animate-pulse" />
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-black uppercase tracking-tight">
                  Mais Desejados
                </h2>
              </div>
              <PromoHero produtos={promoProducts} />
            </section>
          )}

          {/* Latest Products Grid */}
          <section className="space-y-8">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-2xl md:text-3xl font-display font-black">Lançamentos</h2>
                <p className="text-muted-foreground">As últimas novidades para o seu estilo</p>
              </div>
              <Link to="/loja" className="text-brand font-bold text-sm hover:underline inline-flex items-center gap-1">
                Ver tudo <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
              {latestProducts.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
      <CartDrawer />
    </div>
  );
}

