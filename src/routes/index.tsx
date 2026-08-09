import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartDrawer } from "@/components/cart-drawer";
import { ArrowRight } from "lucide-react";

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
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-2xl animate-fade-in">
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
      </main>

      <SiteFooter />
      <CartDrawer />
    </div>
  );
}
