import { createFileRoute, Link } from "@tanstack/react-router";
import { BRAND } from "@/lib/config";
import { Calendar } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/eventos")({
  head: () => ({
    meta: [
      { title: `Eventos — ${BRAND}` },
    ],
  }),
  component: AdminEventosPage,
});

function AdminEventosPage() {
  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Eventos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie eventos, lançamentos e datas especiais da marca.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-1 mb-8">
        <div className="flex items-center gap-1">
          <Link 
            to="/admin" 
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent transition-colors"
            activeProps={{ className: "!text-foreground !border-primary" }}
            activeOptions={{ exact: true }}
          >
            Dashboard
          </Link>

          <Link 
            to="/admin/produtos" 
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent transition-colors"
            activeProps={{ className: "!text-foreground !border-primary" }}
            activeOptions={{ exact: true }}
          >
            Produtos
          </Link>

          <Link 
            to="/admin/vendas" 
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent transition-colors"
            activeProps={{ className: "!text-foreground !border-primary" }}
            activeOptions={{ exact: true }}
          >
            Vendas
          </Link>

          <Link 
            to="/admin/usuarios" 
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent transition-colors"
            activeProps={{ className: "!text-foreground !border-primary" }}
            activeOptions={{ exact: true }}
          >
            Usuários
          </Link>

          <Link 
            to="/admin/eventos" 
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent transition-colors"
            activeProps={{ className: "!text-foreground !border-primary" }}
            activeOptions={{ exact: true }}
          >
            Eventos
          </Link>

        </div>
      </div>

      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 p-8 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-muted text-muted-foreground">
          <Calendar className="h-8 w-8" />
        </div>
        <h3 className="mt-4 font-display text-lg font-semibold">Área em construção</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Esta funcionalidade será implementada em breve. Por enquanto, a seção de eventos está vazia.
        </p>
      </div>
    </div>
  );
}
