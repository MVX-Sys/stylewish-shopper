import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ShoppingBag, User, Search, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listCategorias } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { BRAND } from "@/lib/config";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const { count, setOpen } = useCart();
  const { session, isAdmin } = useAuth();
  const { data: cats = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: listCategorias,
  });
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const currentSearch = useRouterState({ select: (r) => r.location.search }) as {
    cat?: string;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="border-b border-border/60">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-1.5 text-[11px] tracking-wider text-muted-foreground">
          Frete e pedidos pelo WhatsApp · Atendimento personalizado
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-4 md:gap-8">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-foreground text-background font-display text-lg font-semibold">
            A
          </div>
          <span className="hidden font-display text-lg font-semibold tracking-tight sm:inline">
            {BRAND}
          </span>
        </Link>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            nav({ to: "/", search: { q } as never });
          }}
          className="relative mx-auto w-full max-w-xl"
        >
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="O que você procura hoje?"
            className="w-full rounded-full border border-input bg-muted/40 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-foreground focus:bg-background"
          />
        </form>

        <div className="flex items-center gap-1 text-sm sm:gap-2">
          {session ? (
            <div className="hidden items-center gap-1 sm:flex">
              <Link
                to={isAdmin ? "/admin" : "/auth"}
                className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm hover:bg-accent"
              >
                <User className="h-4 w-4" />
                <span className="hidden md:inline">
                  {isAdmin ? "Painel" : "Minha conta"}
                </span>
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                }}
                className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm hover:bg-accent sm:flex"
            >
              <User className="h-4 w-4" />
              <span className="hidden md:inline">Entrar</span>
            </Link>
          )}
          <button
            onClick={() => setOpen(true)}
            className="relative rounded-full p-2.5 transition-colors hover:bg-accent"
            aria-label="Carrinho"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-foreground px-1 text-[10px] font-semibold text-background">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {cats.length > 0 && (
        <nav className="border-t border-border/60">
          <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link
              to="/"
              search={{} as never}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors ${
                currentPath === "/" && !currentSearch?.cat
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              Todas
            </Link>
            {cats.map((c) => {
              const active = currentSearch?.cat === c.slug;
              return (
                <Link
                  key={c.id}
                  to="/"
                  search={{ cat: c.slug } as never}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors ${
                    active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {c.nome}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
