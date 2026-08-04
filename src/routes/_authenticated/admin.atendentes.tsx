import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  Loader2,
  Plus,
  Trash2,
  User,
  Phone,
  Briefcase,
  X,
  UserPlus,
  Camera,
  Upload,
} from "lucide-react";
import {
  listAtendentes,
  createAtendente,
  updateAtendente,
  deleteAtendente,
  type AtendenteRow,
} from "@/lib/atendentes.functions";
import { BRAND } from "@/lib/config";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/atendentes")({
  head: () => ({
    meta: [
      { title: `Atendentes — ${BRAND}` },
      {
        name: "description",
        content: `Gerencie os atendentes do WhatsApp na ${BRAND}.`,
      },
    ],
  }),
  component: AtendentesPage,
});

function AtendentesPage() {
  const { isAdmin, roleKind } = useAuth();
  const fetchAtendentes = useServerFn(listAtendentes);
  const addAtendente = useServerFn(createAtendente);
  const editAtendente = useServerFn(updateAtendente);
  const removeAtendente = useServerFn(deleteAtendente);
  const qc = useQueryClient();

  const [showAdd, setShowAdd] = useState(false);
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cargo, setCargo] = useState("Vendedor");
  const [fotoPath, setFotoPath] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: atendentes, isLoading, error: queryError } = useQuery({
    queryKey: ["admin", "atendentes"],
    queryFn: () => fetchAtendentes(),
    enabled: !!roleKind && roleKind !== "cliente",
  });

  const addMutation = useMutation({
    mutationFn: (data: { nome: string; whatsapp: string; cargo: string; foto_path?: string | null }) =>
      addAtendente({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "atendentes"] });
      setShowAdd(false);
      setNome("");
      setWhatsapp("");
      setCargo("Vendedor");
      setFotoPath(null);
      toast.success("Atendente adicionado!");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao adicionar atendente"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeAtendente({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "atendentes"] });
      toast.success("Atendente removido!");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (args: { id: string; ativo: boolean }) =>
      editAtendente({ data: { id: args.id, ativo: args.ativo } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "atendentes"] }),
  });

  if (roleKind === "cliente") {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Acesso restrito ao painel administrativo.
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-10 text-center text-sm text-destructive">
        Erro ao carregar atendentes. Por favor, verifique se a tabela foi criada corretamente.
        <br />
        <button 
          onClick={() => qc.invalidateQueries({ queryKey: ["admin", "atendentes"] })}
          className="mt-4 rounded-full bg-destructive px-4 py-2 text-white"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Atendentes WhatsApp
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie quem recebe os pedidos dos clientes no WhatsApp.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="btn-shine inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-95 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Novo atendente
        </button>
      </div>

      {isLoading ? (
        <div className="grid place-items-center rounded-2xl border border-border bg-card py-16">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando atendentes…
          </div>
        </div>
      ) : atendentes?.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Nenhum atendente cadastrado.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {atendentes?.map((a: AtendenteRow) => (
            <div
              key={a.id}
              className={`relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all ${
                !a.ativo ? "opacity-60" : "hover:border-primary/30 hover:shadow-md"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-primary">
                  {a.foto_path ? (
                    <img
                      src={`${supabase.storage.from("atendentes-v1-private").getPublicUrl(a.foto_path).data.publicUrl}?t=${new Date(a.criado_em).getTime()}`}
                      alt={a.nome}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        console.error("Erro ao carregar imagem do atendente:", a.nome);
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const icon = document.createElement('div');
                          icon.className = "flex h-full w-full items-center justify-center bg-primary/10 text-primary";
                          icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                          parent.appendChild(icon);
                        }
                      }}
                    />
                  ) : (
                    <User className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="truncate font-display font-semibold text-foreground">
                    {a.nome}
                  </h3>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Briefcase className="h-3 w-3" />
                    {a.cargo}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {a.whatsapp}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <button
                  onClick={() => toggleMutation.mutate({ id: a.id, ativo: !a.ativo })}
                  className={`text-xs font-semibold ${
                    a.ativo ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {a.ativo ? "Ativo" : "Inativo"}
                </button>
                <button
                  onClick={() => {
                    if (confirm("Deseja realmente excluir este atendente?")) {
                      deleteMutation.mutate(a.id);
                    }
                  }}
                  className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Novo atendente</h2>
              <button onClick={() => setShowAdd(false)} className="rounded-full p-1.5 hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Nome
                </label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Gustavo"
                  className="input"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  WhatsApp (com DDD e 55)
                </label>
                <input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Ex: 5587991547820"
                  className="input"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Cargo
                </label>
                <input
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="Ex: Vendedor"
                  className="input"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Foto do Perfil
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative grid h-16 w-16 place-items-center overflow-hidden rounded-full border-2 border-dashed border-border bg-muted text-muted-foreground">
                    {fotoPath ? (
                      <img
                        src={`${supabase.storage.from("atendentes-v1-private").getPublicUrl(fotoPath).data.publicUrl}?t=${Date.now()}`}
                        alt="Preview"
                        className="h-full w-full object-cover"
                        key={fotoPath}
                        onLoad={() => console.log("Preview image loaded successfully")}
                        onError={(e) => {
                          console.error("Preview image load error:", e);
                          toast.error("Erro ao carregar preview da imagem");
                        }}
                      />
                    ) : (
                      <User className="h-8 w-8" />
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold transition-colors hover:bg-accent">
                    <Upload className="h-3.5 w-3.5" />
                    {fotoPath ? "Alterar foto" : "Upload foto"}
                    <input
                      type="file"
                      accept="image/*,.heic,.heif,.webp,.avif"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        try {
                          setIsUploading(true);
                          const fileExt = file.name.split(".").pop();
                          const filePath = `${crypto.randomUUID()}.${fileExt}`;

                          const { data: uploadData, error: uploadError } = await supabase.storage
                            .from("atendentes-v1-private")
                            .upload(filePath, file, {
                              cacheControl: "0",
                              upsert: true
                            });

                          if (uploadError) {
                            console.error("Upload error detail:", uploadError);
                            // If it's a 403, it's definitely RLS/Bucket policy
                            if ((uploadError as any).status === 403 || uploadError.message?.includes("row-level security")) {
                              throw new Error("Erro de permissão no servidor. O bucket 'atendentes' pode não estar configurado corretamente.");
                            }
                            throw uploadError;
                          }
                          
                          setFotoPath(filePath);
                          toast.success("Foto carregada!");
                        } catch (err: any) {
                          console.error("Erro upload completo:", err);
                          toast.error(`Erro ao carregar imagem: ${err.message || "Tente novamente"}`);
                        } finally {
                          setIsUploading(false);
                        }
                      }}
                    />
                  </label>
                  {fotoPath && (
                    <button
                      type="button"
                      onClick={() => setFotoPath(null)}
                      className="text-xs font-medium text-destructive hover:underline"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-8 flex gap-3 pt-4">
                <button
                  onClick={() => setShowAdd(false)}
                  className="flex-1 rounded-full border border-border py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => addMutation.mutate({ nome, whatsapp, cargo, foto_path: fotoPath })}
                  disabled={addMutation.isPending || !nome || !whatsapp}
                  className="flex-1 btn-shine rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {addMutation.isPending ? "Salvando…" : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
