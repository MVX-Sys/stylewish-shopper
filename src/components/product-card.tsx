import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { brl } from "@/lib/format";
import { getImageUrl } from "@/lib/storage";
import { isEsgotado, type ProductListItem } from "@/lib/products";

export function ProductCard({ p }: { p: ProductListItem }) {
  const [img, setImg] = useState<string>("");
  const esgotado = isEsgotado(p);
  const principal =
    p.imagens.find((i) => i.principal) ??
    [...p.imagens].sort((a, b) => a.ordem - b.ordem)[0];

  useEffect(() => {
    if (principal) getImageUrl(principal.storage_path).then(setImg);
  }, [principal]);

  return (
    <Link
      to="/produto/$id"
      params={{ id: p.id }}
      className="group block overflow-hidden rounded-md border border-border bg-card transition-shadow hover:shadow-sm"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {img ? (
          <img
            src={img}
            alt={p.nome}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">
            sem imagem
          </div>
        )}
        {esgotado && (
          <div className="absolute inset-x-0 bottom-0 bg-destructive py-1.5 text-center text-[11px] font-bold tracking-wider text-destructive-foreground">
            ESGOTADO
          </div>
        )}
      </div>
      <div className="p-3 text-center">
        <h3 className="truncate text-sm font-medium uppercase tracking-wide">
          {p.nome}
        </h3>
        <p className="mt-1 text-sm font-semibold">{brl(p.preco)}</p>
      </div>
    </Link>
  );
}
