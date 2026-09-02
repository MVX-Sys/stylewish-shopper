import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { BRAND } from "@/lib/config";
import { ArrowLeft, Loader2, ShieldCheck, Check, X } from "lucide-react";
import { validarSenha, formatarTelefone } from "@/lib/password";

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
  const { session, isAdmin } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);

  const senhaCheck = validarSenha(password, { email, telefone });
  const telefoneDigitos = telefone.replace(/\D/g, "");

  useEffect(() => {
    if (session) {
      if (isAdmin) {
        nav({ to: "/admin" });
      } else {
        nav({ to: "/" });
      }
    }
  }, [session, isAdmin, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        if (telefoneDigitos.length < 10 || telefoneDigitos.length > 11) {
          throw new Error("Informe um telefone válido com DDD.");
        }
        if (!senhaCheck.ok) {
          throw new Error(senhaCheck.errors[0] ?? "Senha insegura.");
        }
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { telefone: formatarTelefone(telefone), telefone_digitos: telefoneDigitos },
          },
        });
        
        if (signUpError) throw signUpError;

        if (signUpData.user) {
          // Tentar atribuir o papel de admin se for o primeiro usuário
          const { data: adminExists } = await supabase
            .from("user_roles")
            .select("id")
            .eq("role", "admin")
            .limit(1)
            .maybeSingle();

          if (!adminExists) {
            await supabase.from("user_roles").insert({
              user_id: signUpData.user.id,
              role: "admin"
            });
          }
        }

        toast.success("Cadastro criado! Você já pode entrar.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo!");
      }
    } catch (err: any) {
      console.error("Auth error caught in handler:", err);
      
      let message = "Erro desconhecido na autenticação";
      
      if (err?.message) {
        message = err.message;
      } else if (err?.error_description) {
        message = err.error_description;
      } else if (typeof err === "string") {
        message = err;
      } else if (err && typeof err === "object") {
        try {
          // Tenta extrair a mensagem do erro AuthError do Supabase
          const errorMsg = err.message || (err.error && err.error.message);
          if (errorMsg) {
            message = errorMsg;
          } else {
            const stringified = JSON.stringify(err);
            if (stringified !== "{}") {
              message = stringified;
            }
          }
        } catch (e) {}
      }
      
      // Fallback para exibir o erro diretamente na UI se o Toaster falhar
      console.log("SURFACING ERROR:", message);
      toast.error(message);
      // Fallback garantido se o Sonner estiver com problemas de portal
      const errDisplay = document.getElementById("auth-error-display");
      if (errDisplay) {
        errDisplay.innerText = message;
        errDisplay.classList.remove("hidden");
        setTimeout(() => errDisplay.classList.add("hidden"), 8000);
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Saiu da conta.");
  };

  return (
    <Suspense fallback={
      <div className="grid min-h-screen bg-background md:grid-cols-2 animate-pulse">
        <div className="hidden bg-foreground md:block"></div>
        <div className="flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      </div>
    }>
      <div className="grid min-h-screen bg-background md:grid-cols-2">
        {/* Left brand panel */}
        <div className="relative hidden overflow-hidden bg-foreground p-10 text-background md:flex md:flex-col md:justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm opacity-80 transition-opacity hover:opacity-100">
            <ArrowLeft className="h-4 w-4" /> Voltar à loja
          </Link>
          <div>
            <div className="grid h-14 w-14 place-items-center rounded-full bg-background text-foreground font-display text-2xl font-semibold">
              A
            </div>
            <h2 className="mt-6 max-w-md font-display text-4xl font-semibold leading-tight tracking-tight">
              {BRAND}
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed opacity-70">
              Acesse sua conta para gerenciar seus pedidos, acompanhar entregas e receber ofertas exclusivas.
            </p>
          </div>
          <p className="text-xs uppercase tracking-widest opacity-50">
            Acesso Seguro
          </p>
        </div>

        {/* Right form panel */}
        <div className="flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-sm">
            <Link
              to="/"
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground md:hidden"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>

            {session ? (
              <div className="space-y-5">
                <div>
                  <h1 className="font-display text-2xl font-semibold">
                    Você já está conectado
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {session.user.email}
                  </p>
                </div>

                {isAdmin ? (
                  <Link
                    to="/admin"
                    className="btn-shine block w-full rounded-full bg-foreground py-3 text-center text-sm font-semibold text-background transition-opacity hover:opacity-90"
                  >
                    Ir para o painel admin
                  </Link>
                ) : (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex flex-col items-center text-center gap-3">
                      <ShieldCheck className="h-10 w-10 text-primary" />
                      <div>
                        <p className="text-sm font-semibold">Conta de Cliente</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Sua conta está ativa. Você pode visualizar seus pedidos e gerenciar seus dados no seu perfil.
                        </p>
                      </div>
                      <Link
                        to="/perfil"
                        className="btn-perfil w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                      >
                        Acessar meu perfil
                      </Link>
                    </div>
                  </div>
                )}
                <button
                  onClick={signOut}
                  className="block w-full text-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Sair da conta
                </button>
              </div>
            ) : (
              <>
                <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">
                  {mode === "signin" ? "Bem-vindo de volta" : "Criar sua conta"}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {mode === "signin"
                    ? "Entre para acompanhar seus pedidos."
                    : "Cadastre-se para realizar pedidos e salvar seu histórico."}
                </p>

                <div id="auth-error-display" className="mt-4 hidden rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20 animate-fade-in-up"></div>

                <form onSubmit={submit} className="mt-8 space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Email
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="voce@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-foreground"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Senha
                    </span>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-foreground"
                    />
                  </label>
                  <button
                    disabled={loading}
                    className="btn-shine flex w-full items-center justify-center rounded-full bg-foreground py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : mode === "signin" ? (
                      "Entrar"
                    ) : (
                      "Cadastrar"
                    )}
                  </button>
                </form>

                <button
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                  className="mt-5 block w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {mode === "signin" ? (
                    <>
                      Não tem conta? <span className="font-semibold underline underline-offset-4">Cadastre-se</span>
                    </>
                  ) : (
                    <>
                      Já tem conta? <span className="font-semibold underline underline-offset-4">Entrar</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </Suspense>
  );
}
