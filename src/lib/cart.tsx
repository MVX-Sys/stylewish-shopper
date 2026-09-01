import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = {
  key: string; // variacaoId|cor|tamanho
  variacaoId: string;
  produtoId: string;
  nome: string;
  cor: string;
  hexCor: string;
  tamanho: string;
  preco: number; // preço base (sem promoção)
  precoPromocional?: number | null; // preço promocional definido, se houver
  promocaoAte?: string | null; // ISO expiry
  quantidade: number;
  foto?: string | null;
  categoriaId?: string | null;
  categoriaNome?: string | null;
  personalizado?: boolean;
};

// Pedidos personalizados exigem no mínimo 10 peças da mesma categoria
export const MIN_PECAS_PERSONALIZACAO = 10;

export function validarPersonalizacao(items: CartItem[]): string | null {
  const categoriasPersonalizadas = new Map<string, string>();
  for (const i of items) {
    if (i.personalizado) {
      const cat = i.categoriaId || "sem-categoria";
      categoriasPersonalizadas.set(cat, i.categoriaNome || "esta categoria");
    }
  }
  for (const [catId, catNome] of categoriasPersonalizadas) {
    const totalCat = items
      .filter((i) => (i.categoriaId || "sem-categoria") === catId)
      .reduce((s, i) => s + i.quantidade, 0);
    if (totalCat < MIN_PECAS_PERSONALIZACAO) {
      return `Produtos personalizados exigem no mínimo ${MIN_PECAS_PERSONALIZACAO} peças de ${catNome}. Você tem ${totalCat}.`;
    }
  }
  return null;
}

export function itemPrecoEfetivo(i: Pick<CartItem, "preco" | "precoPromocional" | "promocaoAte">): number {
  const promo = i.precoPromocional;
  if (promo == null || promo < 0 || promo >= i.preco) return i.preco;
  if (i.promocaoAte) {
    const ate = new Date(i.promocaoAte).getTime();
    if (!Number.isFinite(ate) || ate <= Date.now()) return i.preco;
  }
  return promo;
}

type CartCtx = {
  items: CartItem[];
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (item: Omit<CartItem, "key" | "quantidade">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  total: number;
  count: number;
};

const Ctx = createContext<CartCtx | null>(null);
const STORAGE_KEY = "achaebusca_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [, setTick] = useState(0);

  // Re-render periodicamente para expirar promoções em tempo real
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, hydrated]);

  const add: CartCtx["add"] = (item, qty = 1) => {
    const cartItem = item as CartItem;
    const key = `${cartItem.variacaoId}|${item.cor}|${item.tamanho}`;
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.key === key);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantidade: copy[idx].quantidade + qty };
        return copy;
      }
      return [...prev, { ...cartItem, key, quantidade: qty }];
    });
  };

  const setQty: CartCtx["setQty"] = (key, qty) => {
    setItems((prev) =>
      prev
        .map((x) => (x.key === key ? { ...x, quantidade: Math.max(0, qty) } : x))
        .filter((x) => x.quantidade > 0),
    );
  };

  const remove: CartCtx["remove"] = (key) =>
    setItems((prev) => prev.filter((x) => x.key !== key));

  const clear = () => setItems([]);

  const total = items.reduce((s, i) => s + itemPrecoEfetivo(i) * i.quantidade, 0);
  const count = items.reduce((s, i) => s + i.quantidade, 0);

  return (
    <Ctx.Provider value={{ items, open, setOpen, add, setQty, remove, clear, total, count }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
