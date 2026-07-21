import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { BRAND } from "@/lib/config";
import { LogOut, Package, Plus } from "lucide-react";

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
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Verificando permissões…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
          <Link to="/admin" className="flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              V
            </span>
            {BRAND} · Admin
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link
              to="/admin"
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
              activeProps={{ className: "text-foreground font-medium" }}
              activeOptions={{ exact: true }}
            >
              <Package className="h-4 w-4" /> Produtos
            </Link>
            <Link
              to="/admin/produtos/novo"
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4" /> Novo
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              Ver loja
            </Link>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                nav({ to: "/auth" });
              }}
              className="flex items-center gap-1 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
