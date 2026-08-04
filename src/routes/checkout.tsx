import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useCart, itemPrecoEfetivo } from "@/lib/cart";
import { brl } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { BRAND, VALOR_MINIMO_COMPRA } from "@/lib/config";
import { ChevronLeft, MessageCircle, FileText, X } from "lucide-react";
import { downloadOrderPDF } from "@/lib/pdf";
import { toast } from "sonner";
import atendenteGustavo from "@/assets/atendente-gustavo.jpg";
import { createOrder } from "@/lib/orders.functions";
import { useServerFn } from "@tanstack/react-start";

type Atendente = { id: string; nome: string; whatsapp: string; foto: string; cargo?: string };
const ATENDENTES: Atendente[] = [
  { id: "gustavo", nome: "Gustavo", whatsapp: "5587991547820", foto: atendenteGustavo, cargo: "Vendedor" },
];

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: `Finalizar pedido — ${BRAND}` },
      {
        name: "description",
        content: `Preencha seus dados para finalizar o pedido pelo WhatsApp na ${BRAND}.`,
      },
    ],
  }),
  component: CheckoutPage,
});

type FormaEnvio = "ENTREGA" | "RETIRADA";
type FormaEntrega = "AZUL CARGO" | "TRANSPORTADORA A COMBINAR";
type FormaPagamento = "PIX" | "DINHEIRO" | "CARTÃO DE CRÉDITO" | "CARTÃO DE DÉBITO";

function CheckoutPage() {
  const { items, total, clear } = useCart();
  const nav = useNavigate();

  const [formaEnvio, setFormaEnvio] = useState<FormaEnvio>("ENTREGA");
  const [cep, setCep] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [estado, setEstado] = useState("");
  const [cidade, setCidade] = useState("");
  const [referencia, setReferencia] = useState("");
  const [formaEntrega, setFormaEntrega] = useState<FormaEntrega>(
    "TRANSPORTADORA A COMBINAR",
  );
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("PIX");
  const [observacoes, setObservacoes] = useState("");
  const [showAtendentes, setShowAtendentes] = useState(false);

  const valorFinal = total;
  const minAtingido = useMemo(
    () => VALOR_MINIMO_COMPRA <= 0 || total >= VALOR_MINIMO_COMPRA,
    [total],
  );

  const finalizar = () => {
    if (items.length === 0) {
      toast.error("Seu carrinho está vazio.");
      return;
    }
    if (!minAtingido) {
      toast.error(`Valor mínimo para compra: ${brl(VALOR_MINIMO_COMPRA)}`);
      return;
    }
    if (formaEnvio === "ENTREGA") {
      if (!cep.trim() || !logradouro.trim() || !numero.trim() || !bairro.trim() || !cidade.trim() || !estado.trim()) {
        toast.error("Preencha o endereço completo para entrega.");
        return;
      }
    }
    setShowAtendentes(true);
  };

  const fnCreateOrder = useServerFn(createOrder);
  const { session } = useAuth();

  const enviarParaAtendente = async (atendente: Atendente) => {
    try {
      if (!session) {
        toast.error("Você precisa estar logado para finalizar o pedido.");
        nav({ to: "/auth" });
        return;
      }
      
      await fnCreateOrder({
        data: {
          total: valorFinal,
          forma_envio: formaEnvio,
          forma_pagamento: formaPagamento,
          observacoes: observacoes,
          endereco: formaEnvio === "ENTREGA" ? {
            cep, logradouro, numero, complemento, bairro, cidade, estado, referencia, formaEntrega
          } : undefined,
          itens: items.map(i => ({
            produto_id: i.produtoId,
            variacao_id: (i as any).variacaoId || i.key.split('|')[0], 
            quantidade: i.quantidade,
            preco_unitario: itemPrecoEfetivo(i),
            nome: i.nome,
            cor: i.cor,
            tamanho: i.tamanho
          }))
        }
      });

      // 2. Gerar mensagem para o WhatsApp
      const linhas = items.map((i) => {
        const variacao = `Cor ${i.cor}, Tam ${i.tamanho}`;
        const preco = itemPrecoEfetivo(i);
        return `• ${i.quantidade}x ${i.nome} — ${variacao} — ${brl(preco)} (subtotal ${brl(preco * i.quantidade)})`;
      });

      const enderecoLinhas =
        formaEnvio === "ENTREGA"
          ? [
              "",
              "*Endereço de entrega*",
              `CEP: ${cep || "-"}`,
              `Logradouro: ${logradouro || "-"}, Nº ${numero || "-"}${complemento ? ` — ${complemento}` : ""}`,
              `Bairro: ${bairro || "-"}`,
              `Cidade/UF: ${cidade || "-"}/${estado || "-"}`,
              referencia ? `Referência: ${referencia}` : "",
              `Forma de entrega: ${formaEntrega}`,
            ].filter(Boolean)
          : ["", "*Entrega*", "Retirada no local"];

      const msg = [
        `Olá, ${atendente.nome}! Gostaria de fazer o seguinte pedido:`,
        "",
        "*Itens*",
        ...linhas,
        "",
        `*Total do pedido:* ${brl(valorFinal)}`,
        "",
        `*Forma de envio:* ${formaEnvio === "ENTREGA" ? "Entrega" : "Retirada no local"}`,
        ...enderecoLinhas,
        "",
        `*Forma de pagamento:* ${formaPagamento}`,
        observacoes ? `\n*Observações*\n${observacoes}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const url = `https://wa.me/${atendente.whatsapp}?text=${encodeURIComponent(msg)}`;
      window.open(url, "_blank");
      toast.success(`Pedido salvo! Redirecionando para o WhatsApp de ${atendente.nome}…`);
      
      setShowAtendentes(false);
      clear();
      nav({ to: "/perfil" });
    } catch (err) {
      console.error("Erro ao salvar pedido:", err);
      toast.error("Erro ao processar pedido. Tente novamente.");
    }
  };




  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Continuar comprando
        </Link>

        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
          Finalizar pedido
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preencha os campos e finalize o pedido pelo WhatsApp.
        </p>

        <div className="mt-4 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm">
          <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="font-semibold text-foreground">
              Atenção: este pedido ainda não é uma compra confirmada.
            </p>
            <p className="mt-1 text-muted-foreground">
              Ao clicar em <span className="font-semibold text-foreground">Finalizar</span>, você será direcionado ao nosso WhatsApp para conversar com um atendente. Todos os detalhes — valores, formas de pagamento, frete e prazo de entrega — serão confirmados por lá antes de qualquer cobrança.
            </p>
          </div>
        </div>

        <section className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm md:p-7">
          {/* Valor mínimo */}
          <Field label="Valor mínimo para compra:">
            <ReadonlyInput value={brl(VALOR_MINIMO_COMPRA)} />
          </Field>

          {/* Valores */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Field label="Valor Pedido:">
              <ReadonlyInput value={brl(total)} />
            </Field>
            <Field label="Desconto:">
              <ReadonlyInput value="Não Aplicado" />
            </Field>
            <Field label="Desconto Cupom:">
              <ReadonlyInput value="Não Aplicado" />
            </Field>
            <Field label="Valor Final:">
              <ReadonlyInput value={brl(valorFinal)} strong />
            </Field>
          </div>

          {/* Forma de envio */}
          <Field label="Forma de Envio:" required className="mt-4">
            <select
              value={formaEnvio}
              onChange={(e) => setFormaEnvio(e.target.value as FormaEnvio)}
              className="input"
            >
              <option value="ENTREGA">ENTREGA</option>
              <option value="RETIRADA">RETIRADA NO LOCAL</option>
            </select>
          </Field>

          {formaEnvio === "ENTREGA" && (
            <>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="CEP:">
                  <input
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    maxLength={9}
                    placeholder="00000-000"
                    className="input"
                  />
                </Field>
                <Field label="Logradouro:" className="sm:col-span-2">
                  <input
                    value={logradouro}
                    onChange={(e) => setLogradouro(e.target.value)}
                    maxLength={120}
                    className="input"
                  />
                </Field>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Número:">
                  <input
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    maxLength={10}
                    className="input"
                  />
                </Field>
                <Field label="Complemento:">
                  <input
                    value={complemento}
                    onChange={(e) => setComplemento(e.target.value)}
                    maxLength={80}
                    className="input"
                  />
                </Field>
                <Field label="Bairro:">
                  <input
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    maxLength={80}
                    className="input"
                  />
                </Field>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Estado:">
                  <input
                    value={estado}
                    onChange={(e) => setEstado(e.target.value.toUpperCase())}
                    maxLength={2}
                    placeholder="UF"
                    className="input"
                  />
                </Field>
                <Field label="Cidade:">
                  <input
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    maxLength={80}
                    className="input"
                  />
                </Field>
              </div>

              <Field label="Ponto de Referência:" className="mt-4">
                <input
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  maxLength={160}
                  className="input"
                />
              </Field>

              <Field label="Forma de Entrega:" required className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {(["AZUL CARGO", "TRANSPORTADORA A COMBINAR"] as FormaEntrega[]).map(
                    (op) => {
                      const active = formaEntrega === op;
                      return (
                        <button
                          key={op}
                          type="button"
                          onClick={() => setFormaEntrega(op)}
                          className={`rounded-md border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                            active
                              ? "border-foreground bg-foreground text-background"
                              : "border-border bg-background hover:bg-accent"
                          }`}
                        >
                          {op}
                        </button>
                      );
                    },
                  )}
                </div>
              </Field>
            </>
          )}

          <Field label="Forma de Pagamento:" required className="mt-4">
            <div className="flex flex-wrap gap-2">
              {(["PIX", "DINHEIRO", "CARTÃO DE CRÉDITO", "CARTÃO DE DÉBITO"] as FormaPagamento[]).map((op) => {
                const active = formaPagamento === op;
                return (
                  <button
                    key={op}
                    type="button"
                    onClick={() => setFormaPagamento(op)}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary/50 hover:bg-accent"
                    }`}
                  >
                    {op}
                  </button>
                );
              })}
            </div>
          </Field>


          <Field label="Observações:" className="mt-4">
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="- PEDIDO FEITO COM AMOR"
              className="input min-h-[110px] resize-y"
            />
          </Field>

          <p className="mt-6 text-xs text-muted-foreground">
            Os campos com <span className="text-foreground">*</span> são obrigatórios.
            Ao finalizar, você será redirecionado ao WhatsApp para <span className="font-semibold text-foreground">conversar com um atendente e confirmar todos os detalhes do pedido</span> antes de qualquer pagamento.
          </p>

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                if (items.length === 0) {
                  toast.error("Seu carrinho está vazio.");
                  return;
                }
                try {
                  downloadOrderPDF({
                    items,
                    total,
                    formaEnvio,
                    formaEntrega: formaEnvio === "ENTREGA" ? formaEntrega : undefined,
                    formaPagamento,
                    endereco:
                      formaEnvio === "ENTREGA"
                        ? { cep, logradouro, numero, complemento, bairro, cidade, estado, referencia }
                        : undefined,
                    observacoes,
                  });
                  toast.success("PDF do pedido baixado!");
                } catch {
                  toast.error("Não foi possível gerar o PDF.");
                }
              }}
              disabled={items.length === 0}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-6 py-3 text-sm font-semibold transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              <FileText className="h-4 w-4" />
              Baixar PDF
            </button>
            <button
              type="button"
              onClick={finalizar}
              disabled={items.length === 0}
              className="btn-shine inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              <MessageCircle className="h-4 w-4" />
              Finalizar
            </button>
          </div>
        </section>
      </main>
      <SiteFooter />

      {showAtendentes && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Escolha um atendente"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowAtendentes(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-premium"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowAtendentes(false)}
              aria-label="Fechar"
              className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="font-display text-xl font-semibold tracking-tight">
              Escolha um atendente
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Toque na foto do atendente para continuar seu pedido pelo WhatsApp.
              Todos os detalhes de pagamento, entrega e valores serão combinados diretamente com ele.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {ATENDENTES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => enviarParaAtendente(a)}
                  className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-background p-4 text-center transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-soft"
                >
                  <div className="relative h-24 w-24 overflow-hidden rounded-full ring-2 ring-border transition-all group-hover:ring-primary">
                    <img
                      src={a.foto}
                      alt={a.nome}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{a.nome}</p>
                    {a.cargo && (
                      <p className="text-xs text-muted-foreground">{a.cargo}</p>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    <MessageCircle className="h-3.5 w-3.5" />
                    Falar no WhatsApp
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  required,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-semibold text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </span>
      {children}
    </label>
  );
}

function ReadonlyInput({ value, strong }: { value: string; strong?: boolean }) {
  return (
    <input
      readOnly
      tabIndex={-1}
      value={value}
      className={`input cursor-default bg-muted/50 ${strong ? "font-semibold" : ""}`}
    />
  );
}
