import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { BRAND } from "@/lib/config";
import { hasAdminPanelAccess } from "@/lib/permissions";
import { LogOut, Loader2, LayoutDashboard, Store } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});


function AdminLayout() {
  const { roleKind, permissions, loading, session } = useAuth();
  const nav = useNavigate();
  const allowed = hasAdminPanelAccess(roleKind, permissions);

  useEffect(() => {
    if (!loading && session && !allowed) nav({ to: "/produtos" });
  }, [allowed, loading, session, nav]);

  if (loading || !allowed) {
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
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-3 sm:gap-4 sm:px-4 md:gap-8">
          <Link to="/admin" className="flex items-center gap-2.5" activeOptions={{ exact: true }}>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-foreground text-background font-display font-semibold">
              A
            </span>
            <div className="hidden leading-tight sm:block">
              <p className="font-display text-sm font-semibold">{BRAND}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {roleKind === "admin" ? "Painel admin" : "Painel funcionário"}
              </p>
            </div>
          </Link>


          <div className="flex gap-2">
            <Link
              to="/admin"
              className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-all hover:bg-accent active:scale-95"
              activeProps={{ className: "!bg-foreground !text-background !border-foreground" }}
              activeOptions={{ exact: true }}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link
              to="/produtos"
              className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-all hover:bg-accent active:scale-95"
            >
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">Voltar à Loja</span>
            </Link>
          </div>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
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
      <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-6 sm:px-4 sm:py-8">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
