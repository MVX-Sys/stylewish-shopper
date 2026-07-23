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
      className="group block"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-border transition-shadow duration-300 group-hover:shadow-lg">
        {img ? (
          <img
            src={img}
            alt={p.nome}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="skeleton h-full w-full" />
        )}

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
          {p.novidade && (
            <span className="rounded-full bg-navy px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-navy-foreground shadow-sm">
              Novidade
            </span>
          )}
          {p.promocao && (
            <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm">
              Promo
            </span>
          )}
        </div>

        {esgotado && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
            <span className="rounded-full bg-destructive px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-destructive-foreground">
              Esgotado
            </span>
          </div>
        )}
      </div>

      <div className="mt-3.5 space-y-1 px-0.5">
        <h3 className="line-clamp-1 text-[13px] font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-sm">
          {p.nome}
        </h3>
        <p className="font-display text-base font-extrabold tabular-nums text-foreground">
          {brl(p.preco)}
        </p>
      </div>
    </Link>
  );
}




export function ProductCardSkeleton() {
  return (
    <div>
      <div className="skeleton aspect-[4/5] rounded-xl" />
      <div className="mt-3 space-y-2 px-0.5">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-4 w-1/3 rounded" />
      </div>
    </div>
  );
}
