import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { listProdutos, listCategorias, type ProductListItem } from "@/lib/products";
import { getImageUrl } from "@/lib/storage";
import { parsePersonalizacoes, getVinculo, normVinculo } from "@/lib/personalizacao";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_authenticated/admin/vinculos")({
  head: () => ({ meta: [{ title: "Vínculos de personalização — Painel" }] }),
  component: VinculosPage,
});

const opcoesDe = (p: ProductListItem) => parsePersonalizacoes((p as any).personalizacoes);

function VinculosPage() {
  const qc = useQueryClient();
  const { data: produtos = [], isLoading } = useQuery({ queryKey: ["admin-produtos-vinculos"], queryFn: listProdutos });
  const personalizaveis = useMemo(() => produtos.filter((p) => opcoesDe(p).length > 0), [produtos]);
  const grupos = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of personalizaveis) {
      const v = getVinculo(opcoesDe(p));
      if (v) m.set(normVinculo(v), v);
    }
    return [...m.values()].sort();
  }, [personalizaveis]);

  const [nome, setNome] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busca, setBusca] = useState("");
  const [filtroCat, setFiltroCat] = useState("");
  const [filtroCod, setFiltroCod] = useState("");
  const { data: categorias = [] } = useQuery({ queryKey: ["categorias"], queryFn: listCategorias });
  const [saving, setSaving] = useState(false);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  useEffect(() => {
    for (const p of produtos) {
      const img = p.imagens.find((i) => i.principal) ?? p.imagens[0];
      if (img && !thumbs[p.id])
        getImageUrl(img.storage_path, { width: 160, quality: 70 }).then((u) =>
          setThumbs((prev) => (prev[p.id] ? prev : { ...prev, [p.id]: u })),
        );
    }
  }, [produtos, thumbs]);

  function abrir(g: string) {
    setNome(g);
    setSel(new Set(personalizaveis.filter((p) => normVinculo(getVinculo(opcoesDe(p))) === normVinculo(g)).map((p) => p.id)));
  }

  async function gravar(id: string, v: string) {
    const p = produtos.find((x) => x.id === id)!;
    const ops = opcoesDe(p).map((o) => ({ ...o, vinculo: v }));
    const { error } = await supabase.from("produtos").update({ personalizacoes: ops } as any).eq("id", id);
    if (error) throw error;
  }

  async function salvar() {
    const v = nome.trim();
    if (!v) return toast.error("Dê um nome ao grupo");
    setSaving(true);
    try {
      for (const p of personalizaveis) {
        const atual = normVinculo(getVinculo(opcoesDe(p)));
        const marcado = sel.has(p.id);
        if (marcado && getVinculo(opcoesDe(p)) !== v) await gravar(p.id, v);
        else if (!marcado && atual === normVinculo(v)) await gravar(p.id, "");
      }
      toast.success("Grupo salvo");
      qc.invalidateQueries({ queryKey: ["admin-produtos-vinculos"] });
    } catch (e: any) {
      toast.error("Não foi possível salvar: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function excluir(g: string) {
    setSaving(true);
    try {
      for (const p of personalizaveis)
        if (normVinculo(getVinculo(opcoesDe(p))) === normVinculo(g)) await gravar(p.id, "");
      toast.success("Grupo removido");
      if (normVinculo(nome) === normVinculo(g)) { setNome(""); setSel(new Set()); }
      qc.invalidateQueries({ queryKey: ["admin-produtos-vinculos"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  const cod = filtroCod.trim().toUpperCase();
  const lista = personalizaveis.filter((p) => {
    if (!p.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    if (filtroCat && p.categoria_id !== filtroCat) return false;
    if (cod) {
      const c = `${p.hash_id ?? ""} ${(p as any).codigo_base ?? ""}`.toUpperCase();
      if (!c.includes(cod)) return false;
    }
    return true;
  });
  const marcarVisiveis = () => setSel((prev) => new Set([...prev, ...lista.map((p) => p.id)]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold">Vínculos de personalização</h1>
        <p className="text-sm text-muted-foreground">
          Produtos do mesmo grupo recebem a mesma personalização: o cliente escolhe no primeiro e ela vale para todos os outros do grupo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Grupos existentes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {grupos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum grupo ainda.</p>}
          {grupos.map((g) => (
            <div key={g} className="flex items-center gap-1 rounded-md border px-2 py-1">
              <button className="text-sm font-medium" onClick={() => abrir(g)}>{g}</button>
              <button aria-label={`Excluir ${g}`} onClick={() => excluir(g)} disabled={saving}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => { setNome(""); setSel(new Set()); }}>
            <Plus className="mr-1 h-4 w-4" /> Novo grupo
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{nome ? `Grupo: ${nome}` : "Novo grupo"}</CardTitle>
          <CardDescription>Dê um nome e marque os produtos que devem ter a mesma personalização.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Input className="max-w-xs" placeholder="Ex: Birkens com regulagem" value={nome} onChange={(e) => setNome(e.target.value)} />
            <Input className="max-w-xs" placeholder="Buscar produto…" value={busca} onChange={(e) => setBusca(e.target.value)} />
            <Button onClick={salvar} disabled={saving}>
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
              Salvar ({sel.size} produtos)
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filtrar por categoria"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={filtroCat}
              onChange={(e) => setFiltroCat(e.target.value)}
            >
              <option value="">Todas as categorias</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            <Input className="max-w-[180px]" placeholder="Filtrar por código" value={filtroCod} onChange={(e) => setFiltroCod(e.target.value)} />
            <Button size="sm" variant="outline" onClick={marcarVisiveis} disabled={lista.length === 0}>
              Marcar todos da lista ({lista.length})
            </Button>
            {(filtroCat || filtroCod || busca) && (
              <Button size="sm" variant="ghost" onClick={() => { setFiltroCat(""); setFiltroCod(""); setBusca(""); }}>
                Limpar filtros
              </Button>
            )}
          </div>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <div className="grid max-h-[60vh] gap-1 overflow-auto sm:grid-cols-2">
              {lista.map((p) => {
                const v = getVinculo(opcoesDe(p));
                const codigo = String(p.hash_id || (p as any).codigo_base || "").trim();
                return (
                  <label key={p.id} className="flex cursor-pointer items-center gap-2.5 rounded-md border p-2 text-sm">
                    <Checkbox
                      checked={sel.has(p.id)}
                      onCheckedChange={(c) => {
                        const n = new Set(sel);
                        c ? n.add(p.id) : n.delete(p.id);
                        setSel(n);
                      }}
                    />
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                      {thumbs[p.id] ? (
                        <img src={thumbs[p.id]} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="skeleton h-full w-full" />
                      )}
                    </div>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{p.nome}</span>
                      <code className="mt-0.5 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono font-bold tracking-widest text-muted-foreground">
                        {codigo || "---"}
                      </code>
                    </span>
                    {v && <span className="text-xs text-muted-foreground">{v}</span>}
                  </label>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
