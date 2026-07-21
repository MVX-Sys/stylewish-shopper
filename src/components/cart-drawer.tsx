import { X, Minus, Plus, MessageCircle, Trash2, ShoppingBag } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { brl } from "@/lib/format";

export function CartDrawer() {
  const { items, open, setOpen, setQty, remove, total, clear } = useCart();
  const nav = useNavigate();

  const finalizar = () => {
    if (items.length === 0) return;
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
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-background shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
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

        <div className="flex-1 overflow-y-auto px-5 py-4">
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
                <li
                  key={i.key}
                  className="flex gap-3 rounded-xl border border-border bg-card p-3 transition-shadow hover:shadow-sm"
                >
                  <div className="mt-1 hidden h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-muted text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid" aria-hidden>
                    {i.cor.slice(0, 3)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{i.nome}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {i.cor} · Tam {i.tamanho}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <button
                        onClick={() => setQty(i.key, i.quantidade - 1)}
                        className="grid h-7 w-7 place-items-center rounded-full border border-border transition-colors hover:bg-accent"
                        aria-label="Menos"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-7 text-center text-sm font-medium tabular-nums">
                        {i.quantidade}
                      </span>
                      <button
                        onClick={() => setQty(i.key, i.quantidade + 1)}
                        className="grid h-7 w-7 place-items-center rounded-full border border-border transition-colors hover:bg-accent"
                        aria-label="Mais"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => remove(i.key)}
                        className="ml-auto rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Remover"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-sm font-semibold tabular-nums">
                    {brl(i.preco * i.quantidade)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-border bg-card px-5 py-4">
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
            <button
              onClick={finalizar}
              className="btn-shine flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 py-3.5 text-sm font-semibold text-background shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
            >
              <MessageCircle className="h-4 w-4" />
              Finalizar pedido
            </button>
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
