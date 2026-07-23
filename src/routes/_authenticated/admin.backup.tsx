import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/audit";
import {
  Download,
  Upload,
  Database,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/backup")({
  component: BackupPage,
});

type BackupPayload = {
  versao: number;
  gerado_em: string;
  categorias: any[];
  produtos: any[];
  variacoes: any[];
  imagens: any[];
};

function BackupPage() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [preview, setPreview] = useState<BackupPayload | null>(null);
  const [replaceMode, setReplaceMode] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    setExporting(true);
    setFeedback(null);
    try {
      const [cats, prods, vars, imgs] = await Promise.all([
        supabase.from("categorias").select("*"),
        supabase.from("produtos").select("*"),
        supabase.from("variacoes_produto").select("*"),
        supabase.from("imagens_produto").select("*"),
      ]);
      if (cats.error || prods.error || vars.error || imgs.error) {
        throw new Error("Falha ao buscar dados");
      }
      const payload: BackupPayload = {
        versao: 1,
        gerado_em: new Date().toISOString(),
        categorias: cats.data ?? [],
        produtos: prods.data ?? [],
        variacoes: vars.data ?? [],
        imagens: imgs.data ?? [],
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      a.href = url;
      a.download = `backup-produtos-${ts}.json`;
      a.click();
      URL.revokeObjectURL(url);
      await logAudit({
        acao: "backup_export",
        entidade: "produto",
        descricao: `Backup exportado (${payload.produtos.length} produtos, ${payload.variacoes.length} variações, ${payload.imagens.length} imagens)`,
        detalhes: {
          produtos: payload.produtos.length,
          variacoes: payload.variacoes.length,
          imagens: payload.imagens.length,
          categorias: payload.categorias.length,
        },
      });
      setFeedback({
        type: "success",
        msg: `Backup gerado com ${payload.produtos.length} produtos.`,
      });
    } catch (e: any) {
      setFeedback({ type: "error", msg: e?.message ?? "Erro ao exportar" });
    } finally {
      setExporting(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as BackupPayload;
      if (!parsed.produtos || !Array.isArray(parsed.produtos)) {
        throw new Error("Arquivo inválido");
      }
      setPreview(parsed);
      setFeedback(null);
    } catch (err: any) {
      setPreview(null);
      setFeedback({
        type: "error",
        msg: "Arquivo inválido: " + (err?.message ?? ""),
      });
    }
  }

  async function handleImport() {
    if (!preview) return;
    if (
      !confirm(
        replaceMode
          ? "SUBSTITUIR: isso apagará TODOS os produtos, variações, imagens e categorias atuais antes de restaurar. Confirmar?"
          : "Restaurar (mesclar) os itens do backup? Registros com o mesmo ID serão sobrescritos.",
      )
    )
      return;
    setImporting(true);
    setFeedback(null);
    try {
      if (replaceMode) {
        // Delete in FK order
        await supabase
          .from("imagens_produto")
          .delete()
          .not("id", "is", null);
        await supabase
          .from("variacoes_produto")
          .delete()
          .not("id", "is", null);
        await supabase.from("produtos").delete().not("id", "is", null);
        await supabase.from("categorias").delete().not("id", "is", null);
      }

      const chunks = <T,>(arr: T[], n = 200) =>
        Array.from({ length: Math.ceil(arr.length / n) }, (_, i) =>
          arr.slice(i * n, i * n + n),
        );

      for (const c of chunks(preview.categorias))
        if (c.length) {
          const { error } = await supabase
            .from("categorias")
            .upsert(c as never, { onConflict: "id" });
          if (error) throw error;
        }
      for (const c of chunks(preview.produtos))
        if (c.length) {
          const { error } = await supabase
            .from("produtos")
            .upsert(c as never, { onConflict: "id" });
          if (error) throw error;
        }
      for (const c of chunks(preview.variacoes))
        if (c.length) {
          const { error } = await supabase
            .from("variacoes_produto")
            .upsert(c as never, { onConflict: "id" });
          if (error) throw error;
        }
      for (const c of chunks(preview.imagens))
        if (c.length) {
          const { error } = await supabase
            .from("imagens_produto")
            .upsert(c as never, { onConflict: "id" });
          if (error) throw error;
        }

      await logAudit({
        acao: "backup_import",
        entidade: "produto",
        descricao: `Backup restaurado (${preview.produtos.length} produtos)${replaceMode ? " — modo SUBSTITUIR" : " — modo mesclar"}`,
        detalhes: {
          modo: replaceMode ? "substituir" : "mesclar",
          produtos: preview.produtos.length,
          variacoes: preview.variacoes.length,
          imagens: preview.imagens.length,
          categorias: preview.categorias.length,
          gerado_em: preview.gerado_em,
        },
      });
      setFeedback({
        type: "success",
        msg: `Restauração concluída: ${preview.produtos.length} produtos.`,
      });
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e: any) {
      setFeedback({
        type: "error",
        msg: "Erro ao restaurar: " + (e?.message ?? ""),
      });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">
          Backup de produtos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Exporte um snapshot completo (produtos, variações, imagens e
          categorias) ou restaure a partir de um arquivo <code>.json</code>.
        </p>
      </div>

      {feedback && (
        <div
          className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
            feedback.type === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">Exportar</h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Gera um arquivo JSON com todo o catálogo atual. Guarde em local
            seguro. As imagens permanecem no storage — o backup inclui os
            caminhos.
          </p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            Baixar backup .json
          </button>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">Restaurar</h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Selecione um arquivo de backup para restaurar o catálogo.
          </p>

          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:bg-accent/70"
          />

          {preview && (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-muted/60 p-3 text-xs">
                <p className="font-medium">Preview do backup</p>
                <p className="mt-1 text-muted-foreground">
                  Gerado em:{" "}
                  {new Date(preview.gerado_em).toLocaleString("pt-BR")}
                </p>
                <ul className="mt-2 grid grid-cols-2 gap-1">
                  <li>Categorias: {preview.categorias.length}</li>
                  <li>Produtos: {preview.produtos.length}</li>
                  <li>Variações: {preview.variacoes.length}</li>
                  <li>Imagens: {preview.imagens.length}</li>
                </ul>
              </div>

              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={replaceMode}
                  onChange={(e) => setReplaceMode(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium">Modo substituir</span>
                  <span className="block text-xs text-muted-foreground">
                    Apaga tudo antes de restaurar. Sem marcar, faz merge por
                    ID (upsert).
                  </span>
                </span>
              </label>

              {replaceMode && (
                <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                  <ShieldAlert className="mt-0.5 h-4 w-4" />
                  <span>
                    Atenção: essa ação é destrutiva e não pode ser desfeita.
                  </span>
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={importing}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Restaurar backup
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
