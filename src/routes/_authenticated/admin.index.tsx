import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  Package, 
  ShoppingBag, 
  TrendingUp, 
  Users, 
  UserPlus, 
  Database, 
  History, 
  Calendar, 
  Bell,
  LayoutDashboard
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { canAccess, type PermissionKey } from "@/lib/permissions";
import { BRAND } from "@/lib/config";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

type MenuOption = {
  to: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  perm: PermissionKey;
  color: string;
};

const MENU_OPTIONS: MenuOption[] = [
  { 
    to: "/admin/produtos", 
    label: "Produtos", 
    description: "Gerencie o catálogo de produtos e variações.",
    icon: <Package className="h-6 w-6" />, 
    perm: "produtos.manage",
    color: "bg-blue-500"
  },
  { 
    to: "/admin/pedidos", 
    label: "Pedidos", 
    description: "Controle as vendas e acompanhe o status dos pedidos.",
    icon: <ShoppingBag className="h-6 w-6" />, 
    perm: "pedidos.view",
    color: "bg-brand"
  },
  { 
    to: "/admin/vendas", 
    label: "Vendas", 
    description: "Análise de desempenho e relatórios de vendas.",
    icon: <TrendingUp className="h-6 w-6" />, 
    perm: "pedidos.view",
    color: "bg-emerald-500"
  },
  { 
    to: "/admin/atendentes", 
    label: "Atendentes", 
    description: "Gerencie a equipe de vendas e atendentes.",
    icon: <UserPlus className="h-6 w-6" />, 
    perm: "usuarios.manage",
    color: "bg-amber-500"
  },
  { 
    to: "/admin/usuarios", 
    label: "Usuários", 
    description: "Gerencie permissões e acessos ao sistema.",
    icon: <Users className="h-6 w-6" />, 
    perm: "usuarios.manage",
    color: "bg-purple-500"
  },
  { 
    to: "/admin/eventos", 
    label: "Eventos", 
    description: "Calendário e gestão de eventos da loja.",
    icon: <Calendar className="h-6 w-6" />, 
    perm: "produtos.manage",
    color: "bg-pink-500"
  },
  { 
    to: "/admin/solicitacoes", 
    label: "Reposições", 
    description: "Pedidos de reposição de estoque feitos por clientes.",
    icon: <Bell className="h-6 w-6" />, 
    perm: "solicitacoes.manage",
    color: "bg-orange-500"
  },
  { 
    to: "/admin/backup", 
    label: "Backup", 
    description: "Exporte e restaure dados do sistema.",
    icon: <Database className="h-6 w-6" />, 
    perm: "backup.manage",
    color: "bg-gray-500"
  },
  { 
    to: "/admin/auditoria", 
    label: "Auditoria", 
    description: "Histórico de ações realizadas no painel.",
    icon: <History className="h-6 w-6" />, 
    perm: "auditoria.view",
    color: "bg-slate-500"
  },
];

function AdminDashboard() {
  const { roleKind, permissions } = useAuth();
  const allowedOptions = MENU_OPTIONS.filter((opt) => canAccess(roleKind, permissions, opt.perm));

  return (
    <div className="space-y-10 py-4">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Painel Administrativo
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Bem-vindo ao centro de controle da {BRAND}. Gerencie todas as áreas do seu negócio em um só lugar.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {allowedOptions.map((option) => (
          <Link
            key={option.to}
            to={option.to}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-brand/5 active:scale-98"
          >
            <div className="flex items-start gap-4">
              <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl ${option.color} text-white shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                {option.icon}
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-xl font-bold tracking-tight">
                  {option.label}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </div>
            
            <div className="absolute bottom-0 left-0 h-1 w-full scale-x-0 bg-brand transition-transform duration-300 group-hover:scale-x-100" />
          </Link>
        ))}
      </div>

      <div className="rounded-3xl bg-muted/50 p-8 text-center sm:p-12">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand/10 text-brand">
          <LayoutDashboard className="h-8 w-8" />
        </div>
        <h2 className="mt-6 font-display text-2xl font-bold tracking-tight">
          Navegação Unificada
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
          Utilize o menu acima ou os atalhos no topo da página para navegar rapidamente entre as diferentes seções do painel.
        </p>
      </div>
    </div>
  );
}
