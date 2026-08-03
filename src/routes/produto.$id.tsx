import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartDrawer } from "@/components/cart-drawer";
import { getProduto, getPromoInfo, isEsgotado, listCategorias, type Categoria } from "@/lib/products";
import { downloadImage, downloadImagesAsZip, getImageUrl } from "@/lib/storage";
import { brl } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { Plus, Minus, ShoppingBag, ChevronLeft, Download, Images, FileText, Bell, X } from "lucide-react";
import { downloadProductPDF } from "@/lib/pdf";
import { WHATSAPP_NUMBER, BRAND } from "@/lib/config";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/produto/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Produto — ACHAEBUSCA` },
      { name: "description", content: `Detalhes do produto ${params.id} na ACHAEBUSCA.` },
    ],
  }),
  component: ProductPage,
  errorComponent: ({ error }) => (
    <div className="p-10 text-center text-sm text-muted-foreground">
      {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-10 text-center">Produto não encontrado.</div>
  ),
});

function ProductPage() {
  const { id } = Route.useParams();
  const { data: p, isLoading } = useQuery({
    queryKey: ["produto", id],
    queryFn: () => getProduto(id),
  });
  const { data: categorias = [] } = useQuery<Categoria[]>({
    queryKey: ["categorias"],
    queryFn: listCategorias,
  });
  const { add, setOpen } = useCart();

  const [imgs, setImgs] = useState<string[]>([]);
  const [mainIdx, setMainIdx] = useState(0);
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [restock, setRestock] = useState<{ cor: string; tam: string } | null>(null);
  const [restockNome, setRestockNome] = useState("");
  const [restockZap, setRestockZap] = useState("");
  const [restockObs, setRestockObs] = useState("");
  const [restockSending, setRestockSending] = useState(false);

  const enviarSolicitacao = async () => {
    if (!p || !restock) return;
    const nome = restockNome.trim();
    const zap = restockZap.trim();
    if (nome.length < 2) return toast.error("Informe seu nome.");
    const digitos = zap.replace(/\D/g, "");
    if (digitos.length < 8) return toast.error("Informe um WhatsApp válido.");
    try {
      setRestockSending(true);
      const { error } = await supabase.from("solicitacoes_reposicao").insert({
        produto_id: p.id,
        cor: restock.cor,
        tamanho: restock.tam,
        cliente_nome: nome,
        cliente_whatsapp: digitos,
        observacao: restockObs.trim() || null,
      });
      if (error) throw error;
      const msg = `Olá! Meu nome é ${nome}. Gostaria de ser avisado(a) por WhatsApp quando o produto *${p.nome}* (cor ${restock.cor}, tamanho ${restock.tam}) da ${BRAND} for reposto.${
        restockObs.trim() ? `\n\nObservação: ${restockObs.trim()}` : ""
      }`;
      window.open(
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,
        "_blank",
        "noopener,noreferrer",
      );
      toast.success("Solicitação registrada! Assim que houver reposição, avisaremos.");
      setRestock(null);
      setRestockNome("");
      setRestockZap("");
      setRestockObs("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível registrar.");
    } finally {
      setRestockSending(false);
    }
  };

  useEffect(() => {
    if (!p) return;
    const paths = [...p.imagens]
      .sort((a, b) => (b.principal ? 1 : 0) - (a.principal ? 1 : 0) || a.ordem - b.ordem)
      .map((i) => i.storage_path);
    Promise.all(paths.map(getImageUrl)).then(setImgs);
  }, [p]);

  const matriz = useMemo(() => {
    if (!p) return { cores: [], tamanhos: [] as string[] };
    const coresMap = new Map<string, { nome: string; hex: string }>();
    const tamanhos = new Set<string>();
    for (const v of p.variacoes) {
      coresMap.set(v.nome_cor, { nome: v.nome_cor, hex: v.hex_cor });
      tamanhos.add(v.tamanho);
    }
    const catSlug = p.categoria_id ? (categorias as Categoria[]).find((c) => c.id === p.categoria_id)?.slug?.toLowerCase() || "" : "";
    const isFootwear = ["chinelos", "tenis", "botas"].some(slug => catSlug.includes(slug));
    const sizeOrder = isFootwear 
      ? ["37", "38", "39", "40", "41", "42", "43", "44"]
      : ["PP", "P", "M", "G", "GG", "XG"];

    const tams = Array.from(tamanhos).sort(
      (a, b) => (sizeOrder.indexOf(a) + 100) - (sizeOrder.indexOf(b) + 100) || a.localeCompare(b),
    );
    return { cores: Array.from(coresMap.values()), tamanhos: tams };
  }, [p]);

  const getVar = (cor: string, tam: string) =>
    p?.variacoes.find((v) => v.nome_cor === cor && v.tamanho === tam);

  const setQ = (k: string, q: number) =>
    setQtys((prev) => ({ ...prev, [k]: Math.max(0, q) }));

  const promo = useMemo(() => (p ? getPromoInfo(p) : null), [p]);
  const precoEfetivo = promo?.ativa ? promo.precoFinal : p?.preco ?? 0;

  const subtotal = useMemo(() => {
    if (!p) return 0;
    return Object.entries(qtys).reduce((s, [, q]) => s + q * precoEfetivo, 0);
  }, [qtys, p, precoEfetivo]);

  const totalItens = Object.values(qtys).reduce((s, q) => s + q, 0);

  const addAoCarrinho = () => {
    if (!p || totalItens === 0) {
      toast.error("Selecione ao menos uma variação.");
      return;
    }
    for (const [key, q] of Object.entries(qtys)) {
      if (q <= 0) continue;
      const [cor, tam] = key.split("||");
      const v = getVar(cor, tam);
      if (!v) continue;
      add(
        {
          produtoId: p.id,
          nome: p.nome,
          cor,
          hexCor: v.hex_cor,
          tamanho: tam,
          preco: p.preco,
          precoPromocional: promo?.ativa ? promo.precoFinal : null,
          promocaoAte: promo?.ativa && promo.validoAte ? promo.validoAte.toISOString() : null,
        },
        q,
      );
    }
    setQtys({});
    setOpen(true);
    toast.success("Adicionado ao carrinho!");
  };

  const [downloading, setDownloading] = useState(false);
  const baixarAtual = async () => {
    if (!imgs[mainIdx] || !p) return;
    try {
      setDownloading(true);
      await downloadImage(imgs[mainIdx], `${p.nome}-${mainIdx + 1}`);
      toast.success("Imagem baixada!");
    } catch {
      toast.error("Não foi possível baixar a imagem.");
    } finally {
      setDownloading(false);
    }
  };
  const baixarTodas = async () => {
    if (imgs.length === 0 || !p) return;
    try {
      setDownloading(true);
      await downloadImagesAsZip(imgs, p.nome);
      toast.success(
        imgs.length === 1 ? "Imagem baixada!" : `${imgs.length} imagens baixadas!`,
      );
    } catch {
      toast.error("Não foi possível baixar as imagens.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-6 md:py-10">
        <nav className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Início</Link>
          <span>/</span>
          <span className="text-foreground">
            {isLoading ? "Carregando…" : p?.nome ?? "Produto"}
          </span>
        </nav>

        {isLoading || !p ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[88px_1fr_1fr]">
            <div className="hidden lg:block">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton mb-2 aspect-square rounded-lg" />
              ))}
            </div>
            <div className="skeleton aspect-square rounded-lg" />
            <div className="space-y-4">
              <div className="skeleton h-8 w-3/4 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-10 w-1/3 rounded" />
              <div className="skeleton h-40 w-full rounded-lg" />
            </div>
          </div>
        ) : (
          <>
            <Link
              to="/"
              className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground lg:hidden"
            >
              <ChevronLeft className="h-4 w-4" /> Continuar comprando
            </Link>

            <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-[88px_1fr_1fr] lg:gap-10">
              {/* Thumbnails */}
              <div className="order-2 flex flex-row flex-wrap gap-2 lg:order-1 lg:flex-col lg:flex-nowrap">
                {imgs.map((u, i) => (
                  <button
                    key={i}
                    onClick={() => setMainIdx(i)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all sm:h-20 sm:w-20 ${
                      i === mainIdx
                        ? "border-foreground ring-2 ring-foreground/10"
                        : "border-border opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={u} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>

              {/* Main image */}
              <div className="order-1 lg:order-2">
                <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
                  {imgs[mainIdx] ? (
                    <img
                      src={imgs[mainIdx]}
                      alt={p.nome}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="skeleton h-full w-full" />
                  )}

                  <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-1.5">
                    {p.novidade && (
                      <span className="rounded-full bg-background/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider shadow-sm backdrop-blur">
                        Novidade
                      </span>
                    )}
                    {promo?.ativa && (
                      <span className="rounded-full bg-brand px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-foreground shadow-sm">
                        -{promo.percentual}% OFF
                      </span>
                    )}
                  </div>

                  {isEsgotado(p) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                      <span className="rounded-full bg-foreground px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-background">
                        Esgotado
                      </span>
                    </div>
                  )}
                </div>

                {imgs.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={baixarAtual}
                      disabled={downloading}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Baixar imagem
                    </button>
                    {imgs.length > 1 && (
                      <button
                        type="button"
                        onClick={baixarTodas}
                        disabled={downloading}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50"
                      >
                        <Images className="h-3.5 w-3.5" />
                        Baixar todas ({imgs.length})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          downloadProductPDF(p);
                          toast.success("PDF do produto baixado!");
                        } catch {
                          toast.error("Não foi possível gerar o PDF.");
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium transition-colors hover:bg-accent"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Baixar PDF
                    </button>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="order-3 space-y-7">
                <div>
                  <h1 className="mt-2 font-display text-2xl font-extrabold leading-tight tracking-tight text-foreground md:text-[32px]">
                    {p.nome}
                  </h1>
                  {promo?.ativa ? (
                    <div className="mt-5 space-y-1.5">
                      <div className="flex items-baseline gap-3">
                        <p className="font-display text-3xl font-extrabold tabular-nums text-primary md:text-4xl">
                          {brl(promo.precoFinal)}
                        </p>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                          -{promo.percentual}%
                        </span>
                        <span className="text-xs text-muted-foreground">/ peça</span>
                      </div>
                      <p className="text-sm font-medium tabular-nums text-muted-foreground line-through">
                        De {brl(promo.precoOriginal)}
                      </p>
                      {promo.validoAte && (
                        <p className="text-[11px] font-medium uppercase tracking-wider text-primary">
                          Promoção válida até{" "}
                          {promo.validoAte.toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="mt-5 flex items-baseline gap-3">
                        <p className="font-display text-3xl font-extrabold tabular-nums text-foreground md:text-4xl">
                          {brl(p.preco)}
                        </p>
                        <span className="text-xs text-muted-foreground">/ peça</span>
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        ou em até 3x sem juros no combinado
                      </p>
                    </>
                  )}
                  {p.descricao && (
                    <p className="mt-6 border-l-2 border-primary/40 pl-4 text-sm leading-relaxed text-muted-foreground">
                      {p.descricao}
                    </p>
                  )}
                </div>



                {matriz.cores.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                    Este produto ainda não possui variações cadastradas.
                  </div>
                ) : (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wider">
                        Escolha cor e tamanho
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {matriz.cores.length} cor{matriz.cores.length > 1 ? "es" : ""} · {matriz.tamanhos.length} tam.
                      </p>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-border bg-card">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/60">
                          <tr>
                            <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Cor
                            </th>
                            {matriz.tamanhos.map((t) => (
                              <th
                                key={t}
                                className="p-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                              >
                                {t}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {matriz.cores.map((c) => (
                            <tr key={c.nome} className="border-t border-border">
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-4 w-4 shrink-0 rounded-full border border-border/80 shadow-sm"
                                    style={{ backgroundColor: c.hex }}
                                    title={`Cor ${c.nome}`}
                                    aria-label={`Cor ${c.nome}`}
                                  />
                                  <span className="text-xs font-medium">{c.nome}</span>
                                </div>
                              </td>
                              {matriz.tamanhos.map((t) => {
                                const v = getVar(c.nome, t);
                                const key = `${c.nome}||${t}`;
                                const q = qtys[key] ?? 0;
                                const disponivel = v && v.quantidade_estoque > 0;
                                if (!v)
                                  return (
                                    <td key={t} className="bg-muted/30 p-3 text-center text-muted-foreground/50">
                                      —
                                    </td>
                                  );
                                if (!disponivel)
                                  return (
                                    <td key={t} className="p-2 text-center">
                                      <button
                                        type="button"
                                        onClick={() => setRestock({ cor: c.nome, tam: t })}
                                        title="Avise-me por WhatsApp quando repor"
                                        className="mx-auto inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:border-brand hover:text-brand"
                                      >
                                        <Bell className="h-3 w-3" />
                                        Avise-me
                                      </button>
                                    </td>
                                  );
                                return (
                                  <td key={t} className="p-2">
                                    <div className="flex flex-col items-center gap-1">
                                      {q === 0 ? (
                                        <button
                                          onClick={() => setQ(key, 1)}
                                          className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-border transition-all hover:border-foreground hover:bg-foreground hover:text-background"
                                          aria-label="Adicionar"
                                        >
                                          <Plus className="h-4 w-4" />
                                        </button>
                                      ) : (
                                        <div className="mx-auto flex items-center justify-center gap-1 rounded-full bg-foreground p-0.5 text-background">
                                          <button
                                            onClick={() => setQ(key, q - 1)}
                                            className="grid h-7 w-7 place-items-center rounded-full hover:bg-background/10"
                                          >
                                            <Minus className="h-3 w-3" />
                                          </button>
                                          <span className="w-5 text-center text-xs font-semibold tabular-nums">
                                            {q}
                                          </span>
                                          <button
                                            onClick={() =>
                                              setQ(key, Math.min(v.quantidade_estoque, q + 1))
                                            }
                                            disabled={q >= v.quantidade_estoque}
                                            className="grid h-7 w-7 place-items-center rounded-full hover:bg-background/10 disabled:opacity-40"
                                          >
                                            <Plus className="h-3 w-3" />
                                          </button>
                                        </div>
                                      )}
                                      <span
                                        className={`text-[10px] font-medium tabular-nums ${
                                          v.quantidade_estoque <= 3
                                            ? "text-destructive"
                                            : "text-muted-foreground"
                                        }`}
                                        title="Estoque disponível"
                                      >
                                        {v.quantidade_estoque} em estoque
                                      </span>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur-md sm:p-4">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      {totalItens} pç{totalItens === 1 ? "" : "s"} · subtotal
                    </p>
                    <p className="font-display text-lg font-bold tabular-nums sm:text-xl">
                      {brl(subtotal)}
                    </p>
                  </div>
                  <button
                    onClick={addAoCarrinho}
                    disabled={totalItens === 0}
                    className="btn-shine inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Adicionar
                  </button>
                </div>



              </div>
            </div>
          </>
        )}
      </main>
      <SiteFooter />
      <CartDrawer />

      {restock && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-t-2xl border border-border bg-card p-5 shadow-xl sm:rounded-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                  Notificação de reposição
                </p>
                <h2 className="mt-1 font-display text-lg font-semibold">
                  Avise-me quando repor
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {p?.nome} · Cor <strong>{restock.cor}</strong> · Tam. <strong>{restock.tam}</strong>
                </p>
              </div>
              <button
                onClick={() => setRestock(null)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-accent"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Seu nome</label>
                <input
                  value={restockNome}
                  onChange={(e) => setRestockNome(e.target.value)}
                  maxLength={120}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                  placeholder="Como podemos te chamar?"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">WhatsApp</label>
                <input
                  value={restockZap}
                  onChange={(e) => setRestockZap(e.target.value)}
                  inputMode="tel"
                  maxLength={40}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                  placeholder="(81) 99999-9999"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Observação (opcional)</label>
                <textarea
                  value={restockObs}
                  onChange={(e) => setRestockObs(e.target.value)}
                  maxLength={500}
                  rows={2}
                  className="mt-1 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                  placeholder="Ex: quero 5 peças assim que chegar"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setRestock(null)}
                className="flex-1 rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent"
              >
                Cancelar
              </button>
              <button
                onClick={enviarSolicitacao}
                disabled={restockSending}
                className="flex-[2] rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground hover:opacity-90 disabled:opacity-50"
              >
                {restockSending ? "Enviando…" : "Enviar solicitação"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
