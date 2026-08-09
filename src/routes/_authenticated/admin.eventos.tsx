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
