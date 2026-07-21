import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { listCategorias, getProduto } from "@/lib/products";
import { getImageUrl } from "@/lib/storage";
import { Trash2, Plus, Upload, X } from "lucide-react";
import { toast } from "sonner";

type VarRow = {
  id?: string;
  nome_cor: string;
  hex_cor: string;
  tamanho: string;
  quantidade_estoque: number;
};

type ImgRow = {
  id?: string;
  storage_path: string;
  principal: boolean;
  ordem: number;
  url?: string;
  _file?: File;
};

const TAMANHOS_PADRAO = ["P", "M", "G", "GG"];

export function ProductForm({ produtoId }: { produtoId?: string }) {
  const qc = useQueryClient();
  const nav = useNavigate();
  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: listCategorias,
  });
  const { data: existing } = useQuery({
    queryKey: ["admin-produto", produtoId],
    queryFn: () => (produtoId ? getProduto(produtoId) : null),
    enabled: !!produtoId,
  });

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState<number>(0);
  const [categoriaId, setCategoriaId] = useState<string>("");
  const [marca, setMarca] = useState("");
  const [novidade, setNovidade] = useState(false);
  const [promocao, setPromocao] = useState(false);
  const [ativo, setAtivo] = useState(true);
  const [imgs, setImgs] = useState<ImgRow[]>([]);
  const [vars, setVars] = useState<VarRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setNome(existing.nome);
    setDescricao(existing.descricao ?? "");
    setPreco(existing.preco);
    setCategoriaId(existing.categoria_id ?? "");
    setMarca(existing.marca ?? "");
    setNovidade(existing.novidade);
    setPromocao(existing.promocao);
    setAtivo(existing.ativo);
    setVars(
      existing.variacoes.map((v) => ({
        id: v.id,
        nome_cor: v.nome_cor,
        hex_cor: v.hex_cor,
        tamanho: v.tamanho,
        quantidade_estoque: v.quantidade_estoque,
      })),
    );
    Promise.all(
      existing.imagens
        .sort((a, b) => a.ordem - b.ordem)
        .map(async (i) => ({
          id: i.id,
          storage_path: i.storage_path,
          principal: i.principal,
          ordem: i.ordem,
          url: await getImageUrl(i.storage_path),
        })),
    ).then(setImgs);
  }, [existing]);

  const onPickFiles = (files: FileList | null) => {
    if (!files) return;
    const nova: ImgRow[] = [];
    Array.from(files).forEach((f, idx) => {
      nova.push({
        storage_path: "",
        principal: false,
        ordem: imgs.length + idx,
        url: URL.createObjectURL(f),
        _file: f,
      });
    });
    setImgs((prev) => {
      const combined = [...prev, ...nova];
      if (!combined.some((x) => x.principal) && combined[0]) combined[0].principal = true;
      return [...combined];
    });
  };

  const removeImg = (idx: number) => {
    setImgs((prev) => {
      const copy = prev.filter((_, i) => i !== idx);
      if (!copy.some((x) => x.principal) && copy[0]) copy[0].principal = true;
      return [...copy];
    });
  };

  const setPrincipal = (idx: number) =>
    setImgs((prev) => prev.map((x, i) => ({ ...x, principal: i === idx })));

  // color groups (rows in variations matrix)
  const cores = Array.from(
    new Map(vars.map((v) => [v.nome_cor, v.hex_cor])).entries(),
  ).map(([nome, hex]) => ({ nome, hex }));

  const addCor = () => {
    const nome = prompt("Nome da cor (ex: Preto)");
    if (!nome) return;
    const hex = prompt("Cor em hex (ex: #000000)", "#000000") ?? "#000000";
    TAMANHOS_PADRAO.forEach((t) =>
      setVars((prev) => [
        ...prev,
        { nome_cor: nome, hex_cor: hex, tamanho: t, quantidade_estoque: 0 },
      ]),
    );
  };

  const removeCor = (nome: string) =>
    setVars((prev) => prev.filter((v) => v.nome_cor !== nome));

  const setEstoque = (cor: string, tam: string, q: number) =>
    setVars((prev) => {
      const idx = prev.findIndex((v) => v.nome_cor === cor && v.tamanho === tam);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantidade_estoque: Math.max(0, q) };
        return copy;
      }
      const hex = cores.find((c) => c.nome === cor)?.hex ?? "#000000";
      return [
        ...prev,
        { nome_cor: cor, hex_cor: hex, tamanho: tam, quantidade_estoque: Math.max(0, q) },
      ];
    });

  const getEstoque = (cor: string, tam: string) =>
    vars.find((v) => v.nome_cor === cor && v.tamanho === tam)?.quantidade_estoque ?? 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || preco < 0 || !categoriaId) {
      toast.error("Nome, preço e categoria são obrigatórios.");
      return;
    }
    setSaving(true);
    try {
      let pid = produtoId;
      const payload = {
        nome,
        descricao: descricao || null,
        preco,
        categoria_id: categoriaId,
        marca: marca || null,
        novidade,
        promocao,
        ativo,
      };
      if (pid) {
        const { error } = await supabase.from("produtos").update(payload).eq("id", pid);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("produtos")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        pid = data.id;
      }

      // upload new images
      for (let i = 0; i < imgs.length; i++) {
        const img = imgs[i];
        if (img._file && !img.storage_path) {
          const ext = img._file.name.split(".").pop() ?? "jpg";
          const path = `${pid}/${crypto.randomUUID()}.${ext}`;
          const { error } = await supabase.storage
            .from("product-images")
            .upload(path, img._file, { upsert: false });
          if (error) throw error;
          img.storage_path = path;
        }
      }

      // sync imagens_produto rows: delete removed, upsert existing/new
      const { data: existingImgs } = await supabase
        .from("imagens_produto")
        .select("id")
        .eq("produto_id", pid);
      const keepIds = new Set(imgs.map((i) => i.id).filter(Boolean));
      const toDelete = (existingImgs ?? [])
        .map((r) => r.id)
        .filter((id) => !keepIds.has(id));
      if (toDelete.length)
        await supabase.from("imagens_produto").delete().in("id", toDelete);

      for (let i = 0; i < imgs.length; i++) {
        const img = imgs[i];
        if (img.id) {
          await supabase
            .from("imagens_produto")
            .update({ principal: img.principal, ordem: i })
            .eq("id", img.id);
        } else if (img.storage_path) {
          await supabase.from("imagens_produto").insert({
            produto_id: pid,
            storage_path: img.storage_path,
            principal: img.principal,
            ordem: i,
          });
        }
      }

      // sync variations: replace-all approach
      await supabase.from("variacoes_produto").delete().eq("produto_id", pid);
      if (vars.length) {
        const { error } = await supabase.from("variacoes_produto").insert(
          vars.map((v) => ({
            produto_id: pid,
            nome_cor: v.nome_cor,
            hex_cor: v.hex_cor,
            tamanho: v.tamanho,
            quantidade_estoque: v.quantidade_estoque,
          })),
        );
        if (error) throw error;
      }

      toast.success("Produto salvo!");
      qc.invalidateQueries({ queryKey: ["admin-produtos"] });
      qc.invalidateQueries({ queryKey: ["produtos"] });
      qc.invalidateQueries({ queryKey: ["admin-produto"] });
      qc.invalidateQueries({ queryKey: ["produto"] });
      nav({ to: "/admin" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* Main */}
        <div className="space-y-6">
          <Card title="Informações básicas">
            <Field label="Nome do produto *">
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                placeholder="Ex: Camiseta Oversized Preta"
                className="input"
              />
            </Field>
            <Field label="Descrição">
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={4}
                placeholder="Detalhes de tecido, caimento, ocasião…"
                className="input resize-none"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Preço base *">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={preco}
                    onChange={(e) => setPreco(Number(e.target.value))}
                    required
                    className="input pl-9"
                  />
                </div>
              </Field>
              <Field label="Marca">
                <input
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  placeholder="Opcional"
                  className="input"
                />
              </Field>
            </div>
            <Field label="Categoria *">
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                required
                className="input bg-background"
              >
                <option value="">Selecione…</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </Field>
          </Card>

          <Card title="Variações · Cores × Tamanhos × Estoque"
            action={
              <button
                type="button"
                onClick={addCor}
                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
              >
                <Plus className="h-3 w-3" /> Adicionar cor
              </button>
            }
          >
            {cores.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                Nenhuma cor cadastrada. Adicione ao menos uma cor para gerenciar estoque.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60">
                    <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="p-3 text-left font-semibold">Cor</th>
                      {TAMANHOS_PADRAO.map((t) => (
                        <th key={t} className="p-3 text-center font-semibold">
                          {t}
                        </th>
                      ))}
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cores.map((c) => (
                      <tr key={c.nome} className="border-t border-border">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-6 w-6 rounded-full border border-border shadow-inner"
                              style={{ backgroundColor: c.hex }}
                            />
                            <span className="font-medium">{c.nome}</span>
                          </div>
                        </td>
                        {TAMANHOS_PADRAO.map((t) => (
                          <td key={t} className="p-2 text-center">
                            <input
                              type="number"
                              min={0}
                              value={getEstoque(c.nome, t)}
                              onChange={(e) => setEstoque(c.nome, t, Number(e.target.value))}
                              className="w-16 rounded-lg border border-input bg-background px-2 py-1.5 text-center text-sm tabular-nums outline-none focus:border-foreground"
                            />
                          </td>
                        ))}
                        <td className="p-2 text-right">
                          <button
                            type="button"
                            onClick={() => removeCor(c.nome)}
                            className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card title="Imagens">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 p-8 text-sm text-muted-foreground transition-colors hover:border-foreground hover:bg-accent">
              <Upload className="h-6 w-6" />
              <span className="font-medium text-foreground">Selecionar imagens</span>
              <span className="text-xs">Arraste ou clique para enviar</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => onPickFiles(e.target.files)}
                className="hidden"
              />
            </label>
            {imgs.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {imgs.map((img, i) => (
                  <div
                    key={i}
                    className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                      img.principal ? "border-foreground ring-2 ring-foreground/10" : "border-border"
                    }`}
                  >
                    {img.url && <img src={img.url} alt="" className="h-full w-full object-cover" />}
                    <button
                      type="button"
                      onClick={() => removeImg(i)}
                      className="absolute right-1 top-1 rounded-full bg-foreground/80 p-1 text-background opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrincipal(i)}
                      className={`absolute inset-x-0 bottom-0 text-[10px] font-semibold uppercase tracking-wider py-1 transition-opacity ${
                        img.principal
                          ? "bg-foreground text-background"
                          : "bg-foreground/70 text-background opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {img.principal ? "Principal" : "Tornar principal"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Visibilidade">
            <div className="space-y-2.5">
              {[
                { key: "ativo", label: "Ativo (visível na loja)", val: ativo, set: setAtivo },
                { key: "novidade", label: "Marcar como novidade", val: novidade, set: setNovidade },
                { key: "promocao", label: "Em promoção", val: promocao, set: setPromocao },
              ].map(({ key, label, val, set }) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-background p-3 text-sm transition-colors hover:bg-accent"
                >
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={val}
                    onChange={(e) => set(e.target.checked)}
                    className="h-4 w-4 accent-foreground"
                  />
                </label>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="sticky bottom-4 z-10 flex flex-col-reverse gap-2 rounded-2xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur-md sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => nav({ to: "/admin" })}
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
        >
          Cancelar
        </button>
        <button
          disabled={saving}
          className="btn-shine inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar produto"}
        </button>
      </div>
    </form>
  );
}

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold">{title}</h3>
        {action}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

