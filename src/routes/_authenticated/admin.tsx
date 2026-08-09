import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { BRAND } from "@/lib/config";
import { canAccess, hasAdminPanelAccess, type PermissionKey } from "@/lib/permissions";
import { LogOut, Package, Loader2, ExternalLink, Bell, History, Users, Database, UserPlus, TrendingUp, Calendar, LayoutDashboard, Store } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
  perm: PermissionKey;
  exact?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" />, perm: "produtos.manage", exact: true },
  { to: "/admin/produtos", label: "Produtos", icon: <Package className="h-4 w-4" />, perm: "produtos.manage" },
  { to: "/admin/atendentes", label: "Atendentes", icon: <UserPlus className="h-4 w-4" />, perm: "usuarios.manage" },
  { to: "/admin/vendas", label: "Vendas", icon: <TrendingUp className="h-4 w-4" />, perm: "pedidos.view" },
  { to: "/admin/solicitacoes", label: "Reposições", icon: <Bell className="h-4 w-4" />, perm: "solicitacoes.manage" },
  { to: "/admin/usuarios", label: "Usuários", icon: <Users className="h-4 w-4" />, perm: "usuarios.manage" },
  { to: "/admin/backup", label: "Backup", icon: <Database className="h-4 w-4" />, perm: "backup.manage" },
  { to: "/admin/auditoria", label: "Auditoria", icon: <History className="h-4 w-4" />, perm: "auditoria.view" },
  { to: "/admin/eventos", label: "Eventos", icon: <Calendar className="h-4 w-4" />, perm: "produtos.manage" },
];

function AdminLayout() {
  const { roleKind, permissions, loading, session } = useAuth();
  const nav = useNavigate();
  const allowed = hasAdminPanelAccess(roleKind, permissions);

  useEffect(() => {
    if (!loading && session && !allowed) nav({ to: "/" });
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

  const visibleNav = NAV_ITEMS.filter((n) => canAccess(roleKind, permissions, n.perm));

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-3 sm:gap-4 sm:px-4 md:gap-8">
          <Link to="/admin" className="flex items-center gap-2.5">
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
              to="/admin/eventos"
              className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-all hover:bg-accent active:scale-95"
              activeProps={{ className: "!bg-foreground !text-background !border-foreground" }}
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Eventos</span>
            </Link>
            <Link
              to="/"
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
      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
