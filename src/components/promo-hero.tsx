import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Flame, Zap, TrendingUp, ArrowRight, ShoppingBag, Clock } from "lucide-react";
import { brl } from "@/lib/format";
import { getImageUrl } from "@/lib/storage";
import { getPromoInfo, type ProductListItem } from "@/lib/products";

function stockOf(p: ProductListItem) {
  if (!p.variacoes || p.variacoes.length === 0) return 99;
  return p.variacoes.reduce((s, v) => s + Math.max(0, v.quantidade_estoque), 0);
}

function useCountdown(target: Date | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!target) return null;
  const diff = Math.max(0, target.getTime() - now);
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return { h, m, s, done: diff === 0 };
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function PromoCard({ p }: { p: ProductListItem }) {
  const promo = getPromoInfo(p);
  const [img, setImg] = useState("");
  const principal =
    p.imagens.find((i) => i.principal) ??
    [...p.imagens].sort((a, b) => a.ordem - b.ordem)[0];
  useEffect(() => {
    if (principal) getImageUrl(principal.storage_path).then(setImg);
  }, [principal]);

  const stock = stockOf(p);
  const lowStock = stock > 0 && stock <= 8;
  const economia = promo.precoOriginal - promo.precoFinal;
  const stockPct = Math.min(100, Math.max(8, (stock / 30) * 100));

  return (
    <Link
      to="/produto/$id"
      params={{ id: p.id }}
      className="group relative flex h-full w-[78vw] max-w-[320px] snap-start flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06] shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06),0_12px_32px_-16px_rgba(15,23,42,0.12)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_4px_12px_-2px_rgba(255,85,0,0.12),0_24px_48px_-20px_rgba(255,85,0,0.28)] hover:ring-primary/20 sm:w-auto sm:max-w-none"
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[4/5] bg-neutral-100">
        {img ? (
          <img
            src={img}
            alt={p.nome}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <div className="h-full w-full animate-pulse bg-neutral-200" />
        )}

        {/* Discount badge — minimal chip */}
        <div className="absolute left-3 top-3 z-10">
          <div className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-primary-foreground shadow-sm">
            <span className="font-display text-[13px] font-black leading-none tabular-nums">
              -{promo.percentual}%
            </span>
          </div>
        </div>

        {/* Flash Sale Badge — subtle */}
        <div className="absolute right-3 top-3 z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-foreground shadow-sm backdrop-blur">
            <Zap className="h-2.5 w-2.5 fill-primary text-primary" />
            Relâmpago
          </span>
        </div>

        {lowStock && (
          <div className="absolute bottom-3 left-3 z-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
              <Flame className="h-2.5 w-2.5" />
              Últimas
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2.5 p-3.5 sm:p-4">
        <h3 className="line-clamp-2 min-h-[2.25rem] text-[13px] font-semibold leading-tight text-foreground sm:text-sm">
          {p.nome}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="font-display text-xl font-black tabular-nums text-foreground sm:text-2xl">
            {brl(promo.precoFinal)}
          </span>
          <span className="text-[11px] font-medium tabular-nums text-muted-foreground line-through">
            {brl(promo.precoOriginal)}
          </span>
        </div>

        <div className="min-h-[1.25rem]">
          {economia > 0 && (
            <p className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              Economize {brl(economia)}
            </p>
          )}
        </div>

        {/* Stock bar — reserva de espaço fixa para manter proporção */}
        <div className="min-h-[2rem]">
          {stock > 0 && stock <= 30 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-medium">
                <span className="inline-flex items-center gap-1 text-orange-600">
                  <Flame className="h-2.5 w-2.5" />
                  Vendendo rápido
                </span>
                <span className="tabular-nums text-muted-foreground">{stock} rest.</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100/80">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-orange-500 transition-all duration-1000"
                  style={{ width: `${Math.max(10, 100 - stockPct)}%` }}
                />
              </div>

            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-auto pt-1">
          <div className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-foreground/10 bg-foreground px-3 py-2 text-[12px] font-semibold text-background transition-all duration-300 group-hover:bg-primary group-hover:border-primary sm:text-[13px]">
            <ShoppingBag className="h-3.5 w-3.5" />
            Comprar
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export function PromoHero({ produtos }: { produtos: ProductListItem[] }) {
  // Nearest expiring promo drives the countdown
  const nearest = useMemo(() => {
    const dates = produtos
      .map((p) => getPromoInfo(p).validoAte)
      .filter((d): d is Date => !!d && d.getTime() > Date.now())
      .sort((a, b) => a.getTime() - b.getTime());
    return dates[0] ?? null;
  }, [produtos]);

  const countdown = useCountdown(nearest);

  if (produtos.length === 0) return null;

  const items = produtos.slice(0, 4);

  return (
    <section className="relative mb-10 overflow-hidden rounded-[1.5rem] sm:mb-12 sm:rounded-[2.5rem]">
      {/* Background */}
      <div className="absolute inset-0 bg-primary/10 transition-colors" />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(255,85,0,0.25), transparent 45%), radial-gradient(circle at 85% 80%, rgba(255,130,50,0.2), transparent 50%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.12] sm:opacity-[0.15]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0,0,0,0.4) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />

      <div className="relative px-4 py-6 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-5 sm:mb-8 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary shadow-sm ring-1 ring-primary/20 backdrop-blur-sm sm:mb-3 sm:gap-2 sm:px-3 sm:py-1.5 sm:text-[11px] sm:tracking-[0.18em]">
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary sm:h-2 sm:w-2" />
              </span>
              Ofertas ao vivo
            </div>
            <h2 className="font-display text-[2rem] font-black leading-[0.95] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Promoções{" "}
              <span className="bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
                do Dia
              </span>
            </h2>
            <p className="mt-2 max-w-md text-[13px] leading-snug text-foreground/70 sm:mt-3 sm:text-base">
              Selecionadas a dedo. Preços especiais por tempo limitado — corra antes que acabe.
            </p>
          </div>

          {/* Countdown + CTA */}
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4 lg:flex-col lg:items-end">
            {countdown && !countdown.done && (
              <div className="flex flex-col gap-1.5">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-foreground/60">
                  <Clock className="h-3 w-3" />
                  Termina em
                </span>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  {[
                    { v: countdown.h, l: "Horas" },
                    { v: countdown.m, l: "Min" },
                    { v: countdown.s, l: "Seg" },
                  ].map((u, i) => (
                    <div key={u.l} className="flex items-center gap-1 sm:gap-1.5">
                      <div className="flex min-w-[2.75rem] flex-col items-center rounded-lg bg-foreground/90 px-2 py-1.5 shadow-lg sm:min-w-[3rem] sm:rounded-xl">
                        <span className="font-display text-lg font-black leading-none tabular-nums text-white sm:text-2xl">
                          {pad(u.v)}
                        </span>
                        <span className="mt-0.5 text-[8px] font-semibold uppercase tracking-wider text-white/60 sm:text-[9px]">
                          {u.l}
                        </span>
                      </div>
                      {i < 2 && (
                        <span className="font-display text-lg font-black text-foreground/40 sm:text-xl">
                          :
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Link
              to="/"
              search={{ promocao: "true" }}
              className="btn-shine group inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-[13px] font-bold text-background shadow-xl shadow-foreground/20 transition-all hover:scale-[1.03] hover:shadow-2xl sm:py-3 sm:text-sm"
            >
              Ver todas as ofertas
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Cards: carousel on mobile, grid on sm+ */}
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-pl-4 px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 lg:gap-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((p, i) => (
            <div
              key={p.id}
              className="animate-fade-in h-full shrink-0 sm:shrink"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <PromoCard p={p} />
            </div>
          ))}
          {/* trailing spacer so last card can snap fully on mobile */}
          <div className="w-1 shrink-0 sm:hidden" aria-hidden />
        </div>
      </div>
    </section>
  );
}

