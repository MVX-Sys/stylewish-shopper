import { X, Minus, Plus, MessageCircle, Trash2, ShoppingBag, AlertCircle } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useCart, itemPrecoEfetivo } from "@/lib/cart";
import { brl } from "@/lib/format";
import { getImageUrl } from "@/lib/storage";
import { useEffect, useState } from "react";
import { VALOR_MINIMO_COMPRA } from "@/lib/config";
import { toast } from "sonner";

export function CartDrawer() {
  const { items, open, setOpen, setQty, remove, total, clear } = useCart();
  const nav = useNavigate();
  const minAtingido = total >= VALOR_MINIMO_COMPRA;

  const finalizar = () => {
    if (items.length === 0) return;
    if (!minAtingido) {
      toast.error(`Valor mínimo para compra: ${brl(VALOR_MINIMO_COMPRA)}`);
      return;
    }
    setOpen(false);
    nav({ to: "/checkout" });
  };

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-background shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5" />
            <h3 className="font-display text-base font-semibold">
              Seu carrinho
            </h3>
            {items.length > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                {items.reduce((s, i) => s + i.quantidade, 0)}
              </span>
            )}
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-full p-2 transition-colors hover:bg-accent"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-muted">
                <ShoppingBag className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="mt-4 font-display text-base font-semibold">
                Carrinho vazio
              </p>
              <p className="mt-1 max-w-[240px] text-sm text-muted-foreground">
                Adicione peças ao carrinho para finalizar o pedido pelo WhatsApp.
              </p>
              <button
                onClick={() => setOpen(false)}
                className="mt-6 rounded-full border border-border px-5 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((i) => (
                <CartItemRow key={i.key} item={i} setQty={setQty} remove={remove} />
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-border bg-card px-4 py-4 sm:px-5">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">{brl(total)}</span>
            </div>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold">Total</span>
              <span className="font-display text-xl font-bold tabular-nums">
                {brl(total)}
              </span>
            </div>
            {!minAtingido && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-primary/10 p-3 text-[11px] font-medium text-primary">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Mínimo de {brl(VALOR_MINIMO_COMPRA)} para finalizar o pedido.</span>
              </div>
            )}
            <button
              onClick={finalizar}
              disabled={!minAtingido}
              className={`btn-shine flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-sm transition-all hover:opacity-95 active:scale-[0.98] ${
                !minAtingido ? "cursor-not-allowed opacity-50 grayscale" : ""
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              Finalizar pelo WhatsApp
            </button>

            <p className="mt-2 text-center text-[11px] leading-relaxed text-muted-foreground">
              O pedido será finalizado e discutido pelo WhatsApp com um atendente.
            </p>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <button
                onClick={() => setOpen(false)}
                className="underline-offset-4 hover:text-foreground hover:underline"
              >
                Continuar comprando
              </button>
              <button
                onClick={clear}
                className="underline-offset-4 hover:text-destructive hover:underline"
              >
                Esvaziar
              </button>
            </div>
          </footer>
        )}
      </aside>
    </>
  );
}
