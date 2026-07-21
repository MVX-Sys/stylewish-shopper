import { Link } from "@tanstack/react-router";
import { ShoppingCart, User, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listCategorias } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { BRAND } from "@/lib/config";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

export function SiteHeader() {
  const { count, setOpen } = useCart();
  const { session, isAdmin } = useAuth();
  const { data: cats = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: listCategorias,
  });
  const [q, setQ] = useState("");
  const nav = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:gap-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground font-bold">
            V
          </div>
          <span className="hidden text-sm font-semibold tracking-tight sm:inline">
            {BRAND}
          </span>
        </Link>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            nav({ to: "/", search: { q } as never });
          }}
          className="relative flex-1"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar produto"
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-foreground/40"
          />
        </form>

        <div className="flex items-center gap-3 text-sm">
          {session ? (
            <Link
              to={isAdmin ? "/admin" : "/auth"}
              className="hidden items-center gap-1 hover:text-foreground/70 sm:flex"
            >
              <User className="h-4 w-4" />
              {isAdmin ? "Admin" : "Conta"}
            </Link>
          ) : (
            <Link
              to="/auth"
              className="hidden items-center gap-1 hover:text-foreground/70 sm:flex"
            >
              <User className="h-4 w-4" />
              Entre ou cadastre-se
            </Link>
          )}
          <button
            onClick={() => setOpen(true)}
            className="relative rounded-md p-2 hover:bg-accent"
            aria-label="Carrinho"
          >
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      <nav className="border-t border-border bg-muted/40">
        <div className="mx-auto flex max-w-7xl gap-6 overflow-x-auto px-4 py-2 text-sm">
          {cats.map((c) => (
            <Link
              key={c.id}
              to="/"
              search={{ cat: c.slug } as never}
              className="whitespace-nowrap text-foreground/80 transition-colors hover:text-foreground"
            >
              {c.nome}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
