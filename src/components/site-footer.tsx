import type { ReactNode } from "react";
import { BRAND, WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from "@/lib/config";
import {
  MessageCircle,
  Instagram,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import logoUrl from "@/assets/acha-busca-icon.png";

const MVX_INSTAGRAM = "https://www.instagram.com/mvx_sistemas/";
const MVX_WHATSAPP_1 = { display: "(87) 99168-6116", link: "5587991686116" };
const MVX_WHATSAPP_2 = { display: "(81) 99748-0691", link: "5581997480691" };

function Dpad() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const scrollToBottom = () =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });

  return (
    <div
      className="grid grid-cols-3 gap-1 rounded-xl border border-white/20 bg-white/10 p-2 backdrop-blur-sm"
      aria-label="Direcional de navegação"
    >
      <span className="col-start-2 row-start-1">
        <DpadButton label="Voltar ao topo" onClick={scrollToTop}>
          <ChevronUp className="h-4 w-4" />
        </DpadButton>
      </span>

      <span className="col-start-1 row-start-2">
        <DpadButton label="Voltar" onClick={() => window.history.back()}>
          <ChevronLeft className="h-4 w-4" />
        </DpadButton>
      </span>

      <span className="col-start-2 row-start-2 flex items-center justify-center">
        <img src={logoUrl} alt="" className="h-5 w-5 opacity-80" />
      </span>

      <span className="col-start-3 row-start-2">
        <DpadButton label="Avançar" onClick={() => window.history.forward()}>
          <ChevronRight className="h-4 w-4" />
        </DpadButton>
      </span>

      <span className="col-start-2 row-start-3">
        <DpadButton label="Ir para o final" onClick={scrollToBottom}>
          <ChevronDown className="h-4 w-4" />
        </DpadButton>
      </span>
    </div>
  );
}

function DpadButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 active:scale-95"
    >
      {children}
    </button>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-12 bg-primary text-primary-foreground sm:mt-16">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <img
              src={logoUrl}
              alt=""
              className="h-8 w-8 shrink-0 opacity-90"
            />
            <div className="min-w-0">
              <span className="font-display text-lg font-extrabold tracking-tight">
                acha&amp;busca
              </span>
              <p className="mt-0.5 text-xs text-white/80">
                Fabricação própria · Envio para todo o Brasil · Mínimo 10 peças
              </p>
            </div>
          </div>

          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" />
            {WHATSAPP_DISPLAY}
          </a>
        </div>
      </div>

      <div className="border-t border-white/15 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-6">
          <Dpad />
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-3 text-[11px] text-white/75 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {BRAND}. Todos os direitos reservados.</p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-semibold uppercase tracking-wider">MVX Sistemas</span>
            <a
              href={MVX_INSTAGRAM}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram MVX Sistemas"
              className="inline-flex items-center gap-1 hover:text-white"
            >
              <Instagram className="h-3 w-3" />
              @mvx_sistemas
            </a>
            <a
              href={`https://wa.me/${MVX_WHATSAPP_1.link}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-white"
            >
              <MessageCircle className="h-3 w-3" />
              {MVX_WHATSAPP_1.display}
            </a>
            <a
              href={`https://wa.me/${MVX_WHATSAPP_2.link}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-white"
            >
              <MessageCircle className="h-3 w-3" />
              {MVX_WHATSAPP_2.display}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
