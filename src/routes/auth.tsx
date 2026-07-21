import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { BRAND } from "@/lib/config";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — ACHAEBUSCA" },
      { name: "description", content: "Entre ou cadastre-se na ACHAEBUSCA." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { session, isAdmin, refreshRole } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session && isAdmin) nav({ to: "/admin" });
  }, [session, isAdmin, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Cadastro criado! Você já pode entrar.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo!");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  };

  const claimAdmin = async () => {
    if (!session) return;
    setLoading(true);
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: session.user.id, role: "admin" });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível reivindicar admin (já existe um).");
      return;
    }
    await refreshRole();
    toast.success("Você agora é administrador!");
    nav({ to: "/admin" });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Saiu da conta.");
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm">
        <Link to="/" className="mb-6 block text-center text-sm font-semibold tracking-wide">
          {BRAND}
        </Link>

        {session ? (
          <div className="space-y-4 text-center">
            <p className="text-sm">
              Conectado como <strong>{session.user.email}</strong>
            </p>
            {isAdmin ? (
              <Link
                to="/admin"
                className="inline-block w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Ir para o painel admin
              </Link>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  Se você é o primeiro usuário da loja, clique abaixo para se tornar administrador.
                </p>
                <button
                  onClick={claimAdmin}
                  disabled={loading}
                  className="w-full rounded-md border border-border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50"
                >
                  Reivindicar admin (primeiro usuário)
                </button>
              </>
            )}
            <button
              onClick={signOut}
              className="w-full text-xs text-muted-foreground hover:text-foreground"
            >
              Sair
            </button>
          </div>
        ) : (
          <>
            <h1 className="mb-1 text-lg font-semibold">
              {mode === "signin" ? "Entrar" : "Criar conta"}
            </h1>
            <p className="mb-4 text-xs text-muted-foreground">
              Acesso administrativo da loja.
            </p>
            <form onSubmit={submit} className="space-y-3">
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-input px-3 py-2 text-sm outline-none focus:border-foreground/40"
              />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-input px-3 py-2 text-sm outline-none focus:border-foreground/40"
              />
              <button
                disabled={loading}
                className="w-full rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "..." : mode === "signin" ? "Entrar" : "Cadastrar"}
              </button>
            </form>
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground"
            >
              {mode === "signin"
                ? "Não tem conta? Cadastre-se"
                : "Já tem conta? Entrar"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
