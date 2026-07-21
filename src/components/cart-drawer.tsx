import { X, Minus, Plus, MessageCircle, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { brl } from "@/lib/format";
import { WHATSAPP_NUMBER, BRAND } from "@/lib/config";

export function CartDrawer() {
  const { items, open, setOpen, setQty, remove, total, clear } = useCart();

  const finalizar = () => {
    if (items.length === 0) return;
    const linhas = items.map(
      (i) =>
        `• ${i.quantidade}x ${i.nome} — Cor ${i.cor}, Tam ${i.tamanho} — ${brl(
          i.preco * i.quantidade,
        )}`,
    );
    const msg = [
      `Olá, ${BRAND}! Gostaria de fazer o pedido:`,
      "",
      ...linhas,
      "",
      `Total: ${brl(total)}`,
    ].join("\n");
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-background shadow-xl transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">Seu carrinho</h3>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1 hover:bg-accent"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <p className="mt-10 text-center text-sm text-muted-foreground">
              Seu carrinho está vazio.
            </p>
          ) : (
            <ul className="space-y-4">
              {items.map((i) => (
                <li key={i.key} className="flex gap-3 border-b border-border pb-4">
                  <span
                    className="mt-1 h-5 w-5 shrink-0 rounded-full border border-border"
                    style={{ backgroundColor: i.hexCor }}
                    aria-hidden
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium uppercase">{i.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {i.cor} · Tam {i.tamanho}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => setQty(i.key, i.quantidade - 1)}
                        className="rounded border border-border p-1 hover:bg-accent"
                        aria-label="Menos"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm">{i.quantidade}</span>
                      <button
                        onClick={() => setQty(i.key, i.quantidade + 1)}
                        className="rounded border border-border p-1 hover:bg-accent"
                        aria-label="Mais"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => remove(i.key)}
                        className="ml-auto text-muted-foreground hover:text-destructive"
                        aria-label="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right text-sm font-semibold">
                    {brl(i.preco * i.quantidade)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="border-t border-border p-4">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="text-lg font-bold">{brl(total)}</span>
          </div>
          <button
            onClick={finalizar}
            disabled={items.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[#25D366] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <MessageCircle className="h-4 w-4" /> Finalizar Compra via WhatsApp
          </button>
          {items.length > 0 && (
            <button
              onClick={clear}
              className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Esvaziar carrinho
            </button>
          )}
        </footer>
      </aside>
    </>
  );
}
