import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Categoria } from "@/lib/products";

export type Filters = {
  q: string;
  categoriaSlug: string | null;
  novidades: boolean;
  promocao: boolean;
  precoMin: number;
  precoMax: number;
  ordem: "recentes" | "menor-preco" | "maior-preco" | "nome";
};

export const defaultFilters: Filters = {
  q: "",
  categoriaSlug: null,
  novidades: false,
  promocao: false,
  precoMin: 0,
  precoMax: 500,
  ordem: "recentes",
};

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-md border border-border bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
      >
        {title}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="border-t border-border p-4">{children}</div>}
    </div>
  );
}

export function FilterSidebar({
  categorias,
  filters,
  onChange,
}: {
  categorias: Categoria[];
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) =>
    onChange({ ...filters, [k]: v });

  return (
    <aside className="space-y-3">
      <Section title="Ordenar por">
        <select
          value={filters.ordem}
          onChange={(e) => set("ordem", e.target.value as Filters["ordem"])}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="recentes">Relevância</option>
          <option value="menor-preco">Menor preço</option>
          <option value="maior-preco">Maior preço</option>
          <option value="nome">Nome</option>
        </select>
      </Section>

      <Section title="Categorias">
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={filters.categoriaSlug === null}
              onChange={() => set("categoriaSlug", null)}
            />
            Todas
          </label>
          {categorias.map((c) => (
            <label key={c.id} className="flex items-center gap-2">
              <input
                type="radio"
                checked={filters.categoriaSlug === c.slug}
                onChange={() => set("categoriaSlug", c.slug)}
              />
              {c.nome}
            </label>
          ))}
        </div>
      </Section>

      <Section title="Novidades" defaultOpen={false}>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filters.novidades}
            onChange={(e) => set("novidades", e.target.checked)}
          />
          Apenas novidades
        </label>
      </Section>

      <Section title="Promoção" defaultOpen={false}>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filters.promocao}
            onChange={(e) => set("promocao", e.target.checked)}
          />
          Apenas promoções
        </label>
      </Section>

      <Section title="Preço">
        <div className="space-y-3">
          <input
            type="range"
            min={0}
            max={500}
            value={filters.precoMax}
            onChange={(e) => set("precoMax", Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>R$ 0,00</span>
            <span>Até R$ {filters.precoMax},00</span>
          </div>
        </div>
      </Section>
    </aside>
  );
}
