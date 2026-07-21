import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { BRAND } from "@/lib/config";
import { LogOut, Package, Plus, Loader2, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { isAdmin, loading, session } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && session && !isAdmin) nav({ to: "/auth" });
  }, [isAdmin, loading, session, nav]);

  if (loading || !isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verificando permissões…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:gap-8">
          <Link to="/admin" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-background font-display font-semibold">
              A
            </span>
            <div className="hidden leading-tight sm:block">
              <p className="font-display text-sm font-semibold">{BRAND}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Painel admin
              </p>
            </div>
          </Link>

          <nav className="flex gap-1 text-sm">
            <Link
              to="/admin"
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "!bg-foreground !text-background" }}
              activeOptions={{ exact: true }}
            >
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Produtos</span>
            </Link>
            <Link
              to="/admin/produtos/novo"
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "!bg-foreground !text-background" }}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo</span>
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <Link
              to="/"
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Ver loja</span>
            </Link>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                nav({ to: "/auth" });
              }}
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
