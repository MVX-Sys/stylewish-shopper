import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useCart, itemPrecoEfetivo } from "@/lib/cart";
import { brl } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { BRAND, VALOR_MINIMO_COMPRA } from "@/lib/config";
import { ChevronLeft, MessageCircle, FileText, X, User, Ticket, Loader2 } from "lucide-react";
import { downloadOrderPDF } from "@/lib/pdf";
import { toast } from "sonner";
import { createOrder } from "@/lib/orders.functions";
import { listAtendentes } from "@/lib/atendentes.functions";
import { validateCupon } from "@/lib/coupons.functions";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Atendente = { id: string; nome: string; whatsapp: string; foto_path: string | null; cargo?: string };
// removido ATENDENTES estático

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
type FormaEntrega = "TRANSPORTADORA A COMBINAR";
type FormaPagamento = "PIX";

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
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.tipo_desconto === "fixo") {
      return appliedCoupon.valor_desconto;
    }
    return (total * appliedCoupon.valor_desconto) / 100;
  }, [total, appliedCoupon]);

  const valorFinal = total - discountAmount;
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
    // Removido validações de endereço pois o formulário foi simplificado
    setShowAtendentes(true);
  };

  const fnCreateOrder = useServerFn(createOrder);
  const fetchAtendentes = useServerFn(listAtendentes);
  const fnValidateCoupon = useServerFn(validateCupon);
  const { session } = useAuth();

  const { data: dbAtendentes, isLoading: loadingAtendentes } = useQuery({
    queryKey: ["atendentes"],
    queryFn: () => fetchAtendentes(),
  });

  const atendentes = dbAtendentes || [];

  const enviarParaAtendente = async (atendente: Atendente) => {
    console.log("Iniciando finalização com atendente:", atendente.nome);
    try {
      if (!session) {
        toast.error("Você precisa estar logado para finalizar o pedido.");
        nav({ to: "/auth" });
        return;
      }
      
      console.log("Gerando PDF do pedido...");
      const pdfBlob = await downloadOrderPDF({
        items,
        total,
        formaEnvio,
        formaEntrega: formaEnvio === "ENTREGA" ? "TRANSPORTADORA A COMBINAR" : undefined,
        formaPagamento,
        endereco: formaEnvio === "ENTREGA" ? {} : undefined,
        observacoes,
        cupom: appliedCoupon ? {
          codigo: appliedCoupon.codigo,
          desconto: appliedCoupon.valor_desconto
        } : undefined,
      }, true);

      console.log("Criando pedido no banco...");
      const order = await fnCreateOrder({
        data: {
          total: valorFinal,
          forma_envio: formaEnvio,
          atendente_id: atendente.id,
          cliente_nome: session?.user.email?.split("@")[0] || "Cliente",
          cliente_whatsapp: session?.user.phone || "",
          forma_pagamento: formaPagamento,
          observacoes: observacoes,
          cupom_codigo: appliedCoupon?.codigo,
          desconto_cupom: discountAmount,
          endereco: formaEnvio === "ENTREGA" ? {
            formaEntrega: "TRANSPORTADORA A COMBINAR"
          } : undefined,
          itens: items.map(i => {
            const vId = i.variacaoId || (i as any).variacao_id;
            if (!vId) {
              console.error("Item sem variacaoId:", i);
              throw new Error(`O item "${i.nome}" está com dados incompletos no carrinho. Remova e adicione novamente.`);
            }
            return {
              produto_id: i.produtoId,
              variacao_id: vId,
              quantidade: i.quantidade,
              preco_unitario: itemPrecoEfetivo(i),
              nome: i.nome,
              cor: i.cor,
              tamanho: i.tamanho
            };
          })
        }
      });

      console.log("Pedido criado com sucesso:", order.id);
      
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
              "*Entrega*",
              "Forma de entrega: TRANSPORTADORA A COMBINAR",
            ]
          : ["", "*Entrega*", "Retirada no local"];

      const msgContent = [
        `Olá, ${atendente.nome}! Gostaria de fazer o seguinte pedido:`,
        "",
        "*Itens*",
        ...linhas,
        "",
        `*Total dos itens:* ${brl(total)}`,
        appliedCoupon ? `*Cupom aplicado:* ${appliedCoupon.codigo} (-${appliedCoupon.valor_desconto}%)` : "",
        appliedCoupon ? `*Desconto:* -${brl(discountAmount)}` : "",
        `*Total final:* ${brl(valorFinal)}`,
        "",
        `*Forma de envio:* ${formaEnvio === "ENTREGA" ? "ENTREGA (Transportadora a combinar)" : "Retirada no local"}`,
        ...enderecoLinhas,
        "",
        `*Forma de pagamento:* ${formaPagamento}`,
        observacoes ? `\n*Observações*\n${observacoes}` : "",
        "",
        "_(Acabei de baixar o PDF do meu pedido e estou enviando em anexo aqui)_",
      ]
        .filter(Boolean)
        .join("\n");

      const encodedMsg = encodeURIComponent(msgContent);
      const whatsappUrl = `https://wa.me/${atendente.whatsapp.replace(/\D/g, "")}?text=${encodedMsg}`;
      
      console.log("Redirecionando para WhatsApp:", whatsappUrl);
      toast.success(`Pedido salvo! Redirecionando para o WhatsApp…`);

      // No celular, redirecionar via window.location.href é o método mais robusto.
      // Em alguns casos, browsers mobile bloqueiam redirecionamentos se houver atraso na promise.
      // Definimos o href diretamente.
      window.location.href = whatsappUrl;

      
      setShowAtendentes(false);
      clear();
      // Delay curto para permitir que a animação de toast apareça e o redirecionamento inicie
      setTimeout(() => nav({ to: "/perfil" }), 3000);
    } catch (err: any) {
      console.error("Erro ao salvar pedido:", err);
      // Extrair mensagem de erro se disponível para ajudar no diagnóstico
      const errorMsg = err?.message || (typeof err === 'string' ? err : "");
      toast.error(`Erro ao processar pedido: ${errorMsg || "Tente novamente."}`);
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

        <section className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm md:p-7">
            <h2 className="mb-6 font-display text-lg font-semibold">Itens do pedido</h2>
            <div className="divide-y divide-border">
              {items.map((item) => (
                <div key={item.key} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-white flex items-center justify-center p-1">
                    {item.foto ? (
                      <img
                        src={item.foto}
                        alt={item.nome}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <FileText className="h-8 w-8 opacity-20" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-center">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-1">{item.nome}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.cor} • Tam {item.tamanho}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{item.quantidade}x {brl(itemPrecoEfetivo(item))}</span>
                      <span className="text-sm font-bold text-foreground">{brl(itemPrecoEfetivo(item) * item.quantidade)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Seu carrinho está vazio.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-7 h-fit">
            <h2 className="mb-6 font-display text-lg font-semibold">Resumo do Pedido</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Valor mínimo para compra:">
                <ReadonlyInput value={brl(VALOR_MINIMO_COMPRA)} />
              </Field>
              <Field label="Valor Pedido:">
                <ReadonlyInput value={brl(total)} />
              </Field>
            </div>


          {/* Forma de envio */}
          <Field label="Forma de Envio:" required className="mt-4">
            <select
              value={formaEnvio}
              onChange={(e) => setFormaEnvio(e.target.value as FormaEnvio)}
              className="input"
            >
              <option value="ENTREGA">ENTREGA (Transportadora a combinar)</option>
              <option value="RETIRADA">RETIRADA NO LOCAL</option>
            </select>
          </Field>

          {/* Removido campos de endereço conforme solicitado */}

          <Field label="Forma de Pagamento:" className="mt-4">
            <div className="flex items-center gap-2">
              <div className="rounded-full border border-primary bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground shadow-sm">
                PIX
              </div>
              <span className="text-xs text-muted-foreground italic">(Única forma aceita)</span>
            </div>
          </Field>


          <Field label="Cupom de Desconto:" className="mt-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Ticket className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tem um cupom? Digite aqui"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  disabled={!!appliedCoupon || isValidatingCoupon}
                  className="input pl-10 uppercase font-mono"
                />
              </div>
              {appliedCoupon ? (
                <button
                  type="button"
                  onClick={() => {
                    setAppliedCoupon(null);
                    setCouponCode("");
                  }}
                  className="rounded-lg bg-destructive/10 px-4 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20"
                >
                  Remover
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!couponCode || isValidatingCoupon}
                  onClick={async () => {
                    setIsValidatingCoupon(true);
                    try {
                      const res = await fnValidateCoupon({ data: { codigo: couponCode } });
                      if (res.valid && res.cupom) {
                        const totalItens = items.reduce((s, i) => s + i.quantidade, 0);
                        
                        // Validar valor mínimo do pedido se definido no cupom
                        if (res.cupom.preco_minimo_pedido && total < res.cupom.preco_minimo_pedido) {
                          toast.error(`Este cupom exige um pedido mínimo de ${brl(res.cupom.preco_minimo_pedido)}.`);
                          return;
                        }

                        if (totalItens < res.cupom.quantidade_minima_itens) {
                          toast.error(`Este cupom exige no mínimo ${res.cupom.quantidade_minima_itens} itens no carrinho.`);
                          return;
                        }

                        // Validar produtos específicos (se definido)
                        // Consideramos válido se o ID reduzido ou completo bater com qualquer item no carrinho
                        if (res.cupom.produtos_ids && res.cupom.produtos_ids.length > 0) {
                          const allowedProductIds = res.cupom.produtos_ids.map((id: string) => id.toLowerCase());
                          const hasAllowedProduct = items.some(item => {
                            const pId = item.produtoId.toLowerCase();
                            // Buscamos o produto no estado global para pegar o hash_id se disponível, 
                            // mas por enquanto checamos se o ID fornecido no cupom é prefixo do UUID ou bate com o hash_id visível
                            // Para simplificar, checamos se o ID da restrição está contido no ID do produto ou se é prefixo
                            return allowedProductIds.some(aid => pId.includes(aid) || aid.includes(pId));
                          });

                          if (!hasAllowedProduct) {
                            toast.error("Este cupom não é válido para os produtos no seu carrinho.");
                            return;
                          }
                        }

                        setAppliedCoupon(res.cupom);
                        toast.success("Cupom aplicado com sucesso!");
                      } else {
                        toast.error(res.message || "Cupom inválido.");
                      }
                    } catch (err) {
                      toast.error("Erro ao validar cupom.");
                    } finally {
                      setIsValidatingCoupon(false);
                    }
                  }}
                  className="rounded-lg bg-primary px-6 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 disabled:opacity-40"
                >
                  {isValidatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
                </button>
              )}
            </div>
          </Field>

          {/* Valores de Desconto */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Field label="Desconto:">
              <ReadonlyInput 
                value={
                  appliedCoupon 
                    ? appliedCoupon.tipo_desconto === "fixo" 
                      ? brl(appliedCoupon.valor_desconto) 
                      : `-${appliedCoupon.valor_desconto}%` 
                    : "Não Aplicado"
                } 
              />
            </Field>
            <Field label="Desconto Cupom:">
              <ReadonlyInput value={discountAmount > 0 ? `-${brl(discountAmount)}` : "Não Aplicado"} />
            </Field>
          </div>

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

          <div className="mt-6 border-t border-border pt-6">
            <div className="flex items-center justify-between rounded-xl bg-primary/5 p-4 border border-primary/20">
              <span className="font-display text-lg font-semibold">Valor Final</span>
              <span className="font-display text-2xl font-bold text-primary">{brl(valorFinal)}</span>
            </div>
          </div>


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
                    formaEntrega: formaEnvio === "ENTREGA" ? "TRANSPORTADORA A COMBINAR" : undefined,
                    formaPagamento,
                    endereco:
                      formaEnvio === "ENTREGA"
                        ? {} // Endereço vazio, pois foi removido do formulário
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
              {loadingAtendentes ? "Carregando atendentes..." : atendentes.length === 0 ? "Nenhum atendente disponível no momento." : "Toque na foto do atendente para continuar seu pedido pelo WhatsApp. Todos os detalhes de pagamento, entrega e valores serão combinados diretamente com ele."}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {atendentes.map((a) => (
                <button
                  key={a.id}
                  onClick={() => enviarParaAtendente(a as any)}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
                >
                  <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-border group-hover:border-primary/30">
                    {a.foto_path ? (
                      <img
                        src={`${supabase.storage.from("atendentes-v1-private").getPublicUrl(a.foto_path).data.publicUrl}?t=${Date.now()}`}
                        alt={a.nome}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            const icon = document.createElement('div');
                            icon.className = "flex h-full w-full items-center justify-center bg-primary/10 text-primary";
                            icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-10 w-10"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                            parent.appendChild(icon);
                          }
                        }}
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-primary/10 text-primary">
                        <User className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="font-display text-sm font-semibold">{a.nome}</p>
                    <p className="text-[10px] text-muted-foreground">{a.cargo || "Vendedor"}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                    <MessageCircle className="h-3 w-3" />
                    Falar no WhatsApp
                  </div>
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
