import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { BRAND } from "@/lib/config";
import { canAccess, hasAdminPanelAccess, type PermissionKey } from "@/lib/permissions";
import { LogOut, Package, Loader2, ExternalLink, Bell, History, Users, Database, UserPlus } from "lucide-react";

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
  { to: "/admin", label: "Produtos", icon: <Package className="h-4 w-4" />, perm: "produtos.manage", exact: true },
  { to: "/admin/atendentes", label: "Atendentes", icon: <UserPlus className="h-4 w-4" />, perm: "usuarios.manage" },
  { to: "/admin/solicitacoes", label: "Reposições", icon: <Bell className="h-4 w-4" />, perm: "solicitacoes.manage" },
  { to: "/admin/usuarios", label: "Usuários", icon: <Users className="h-4 w-4" />, perm: "usuarios.manage" },
  { to: "/admin/backup", label: "Backup", icon: <Database className="h-4 w-4" />, perm: "backup.manage" },
  { to: "/admin/auditoria", label: "Auditoria", icon: <History className="h-4 w-4" />, perm: "auditoria.view" },
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

          <nav className="flex gap-1 text-sm">
            {visibleNav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-1.5 rounded-full px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                activeProps={{ className: "!bg-foreground !text-background" }}
                activeOptions={item.exact ? { exact: true } : undefined}
              >
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
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
      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
