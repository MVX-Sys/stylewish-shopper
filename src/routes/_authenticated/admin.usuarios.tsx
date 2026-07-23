import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Loader2, Search, Users, ShieldCheck, MailCheck, MailX } from "lucide-react";
import { listAdminUsers } from "@/lib/admin-users.functions";
import { BRAND } from "@/lib/config";

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  head: () => ({
    meta: [
      { title: `Usuários — ${BRAND}` },
      {
        name: "description",
        content: `Gerencie os usuários cadastrados no painel administrativo da ${BRAND}.`,
      },
    ],
  }),
  component: UsuariosPage,
});

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function UsuariosPage() {
  const fetchUsers = useServerFn(listAdminUsers);
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin", "usuarios"],
    queryFn: () => fetchUsers(),
  });

  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"todos" | "admin" | "user">("todos");

  const filtered = useMemo(() => {
    const list = data ?? [];
    const term = q.trim().toLowerCase();
    return list.filter((u) => {
      if (roleFilter === "admin" && !u.roles.includes("admin")) return false;
      if (roleFilter === "user" && u.roles.includes("admin")) return false;
      if (!term) return true;
      return (
        (u.email ?? "").toLowerCase().includes(term) ||
        u.id.toLowerCase().includes(term) ||
        (u.phone ?? "").toLowerCase().includes(term)
      );
    });
  }, [data, q, roleFilter]);

  const total = data?.length ?? 0;
  const admins = data?.filter((u) => u.roles.includes("admin")).length ?? 0;
  const confirmed = data?.filter((u) => u.email_confirmed_at).length ?? 0;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Usuários cadastrados
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Todos os usuários com conta no sistema.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
        >
          {isFetching ? "Atualizando…" : "Atualizar"}
        </button>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon={<Users className="h-4 w-4" />} label="Total" value={total} />
        <StatCard icon={<ShieldCheck className="h-4 w-4" />} label="Administradores" value={admins} />
        <StatCard icon={<MailCheck className="h-4 w-4" />} label="Email confirmado" value={confirmed} />
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por email, telefone ou ID…"
            className="input pl-9"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
          className="input sm:w-56"
        >
          <option value="todos">Todos os perfis</option>
          <option value="admin">Somente administradores</option>
          <option value="user">Somente clientes</option>
        </select>
      </div>

      {isLoading ? (
        <div className="grid place-items-center rounded-2xl border border-border bg-card py-16">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando usuários…
          </div>
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          Erro ao carregar usuários: {(error as Error)?.message ?? "desconhecido"}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Nenhum usuário encontrado.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 border-b border-border bg-muted/40 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:grid">
            <span>Usuário</span>
            <span>Cadastro</span>
            <span>Último acesso</span>
            <span>Status</span>
            <span>Perfil</span>
          </div>
          <ul className="divide-y divide-border">
            {filtered.map((u) => (
              <li
                key={u.id}
                className="grid grid-cols-1 gap-2 px-4 py-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center md:gap-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {u.email ?? <span className="text-muted-foreground">sem email</span>}
                  </p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">
                    {u.id}
                  </p>
                  {u.phone && (
                    <p className="text-xs text-muted-foreground">Tel: {u.phone}</p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground md:text-sm">
                  <span className="md:hidden font-semibold text-foreground">Cadastro: </span>
                  {formatDate(u.created_at)}
                </div>
                <div className="text-xs text-muted-foreground md:text-sm">
                  <span className="md:hidden font-semibold text-foreground">Último acesso: </span>
                  {formatDate(u.last_sign_in_at)}
                </div>
                <div>
                  {u.email_confirmed_at ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      <MailCheck className="h-3 w-3" /> Confirmado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                      <MailX className="h-3 w-3" /> Pendente
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {u.roles.length === 0 ? (
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                      cliente
                    </span>
                  ) : (
                    u.roles.map((r) => (
                      <span
                        key={r}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          r === "admin"
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {r}
                      </span>
                    ))
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 font-display text-2xl font-semibold tabular-nums">
        {value}
      </p>
    </div>
  );
}
