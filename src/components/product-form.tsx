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
    <form onSubmit={submit} className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <Field label="Nome do produto *">
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="w-full rounded-md border border-input px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Descrição">
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input px-3 py-2 text-sm"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Preço base *">
              <input
                type="number"
                step="0.01"
                min={0}
                value={preco}
                onChange={(e) => setPreco(Number(e.target.value))}
                required
                className="w-full rounded-md border border-input px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Marca">
              <input
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                className="w-full rounded-md border border-input px-3 py-2 text-sm"
              />
            </Field>
          </div>
          <Field label="Categoria *">
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Selecione…</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={novidade}
                onChange={(e) => setNovidade(e.target.checked)}
              />
              Novidade
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={promocao}
                onChange={(e) => setPromocao(e.target.checked)}
              />
              Promoção
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
              />
              Ativo
            </label>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Imagens</p>
          <label className="mb-3 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground hover:bg-accent">
            <Upload className="h-4 w-4" />
            Selecionar imagens
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => onPickFiles(e.target.files)}
              className="hidden"
            />
          </label>
          <div className="grid grid-cols-3 gap-3">
            {imgs.map((img, i) => (
              <div
                key={i}
                className={`group relative aspect-square overflow-hidden rounded-md border ${
                  img.principal ? "border-foreground" : "border-border"
                }`}
              >
                {img.url && <img src={img.url} alt="" className="h-full w-full object-cover" />}
                <button
                  type="button"
                  onClick={() => removeImg(i)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setPrincipal(i)}
                  className={`absolute inset-x-0 bottom-0 text-[10px] py-1 ${
                    img.principal
                      ? "bg-foreground text-background"
                      : "bg-black/50 text-white opacity-0 group-hover:opacity-100"
                  }`}
                >
                  {img.principal ? "Principal" : "Definir como principal"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Variações · Cores × Tamanhos × Estoque</h3>
          <button
            type="button"
            onClick={addCor}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
          >
            <Plus className="h-3 w-3" /> Adicionar cor
          </button>
        </div>
        {cores.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhuma cor cadastrada. Adicione ao menos uma cor para gerenciar estoque.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-left">Cor</th>
                  {TAMANHOS_PADRAO.map((t) => (
                    <th key={t} className="p-2 text-center">
                      {t}
                    </th>
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cores.map((c) => (
                  <tr key={c.nome} className="border-t border-border">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-5 w-5 rounded-full border border-border"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span>{c.nome}</span>
                      </div>
                    </td>
                    {TAMANHOS_PADRAO.map((t) => (
                      <td key={t} className="p-2 text-center">
                        <input
                          type="number"
                          min={0}
                          value={getEstoque(c.nome, t)}
                          onChange={(e) => setEstoque(c.nome, t, Number(e.target.value))}
                          className="w-16 rounded-md border border-input px-2 py-1 text-center text-sm"
                        />
                      </td>
                    ))}
                    <td className="p-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeCor(c.nome)}
                        className="text-destructive hover:opacity-70"
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
      </div>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => nav({ to: "/admin" })}
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent"
        >
          Cancelar
        </button>
        <button
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar produto"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
