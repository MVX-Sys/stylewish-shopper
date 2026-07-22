import { BRAND, WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from "@/lib/config";
import { MessageCircle, Instagram } from "lucide-react";

const MVX_INSTAGRAM = "https://www.instagram.com/mvx_sistemas/";
const MVX_WHATSAPP_1 = { display: "(87) 99168-6116", link: "5587991686116" };
const MVX_WHATSAPP_2 = { display: "(87) 99748-0691", link: "5587997480691" };

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-primary text-primary-foreground sm:mt-20">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <span className="font-display text-2xl font-extrabold tracking-tight">
              acha&amp;busca
            </span>
            <ul className="mt-4 space-y-1.5 text-sm text-white/90">
              <li>Fabricação própria e private label</li>
              <li>Enviamos para todo o Brasil</li>
              <li>Pedido mínimo — 10 peças</li>
            </ul>
          </div>

          <div className="sm:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
              Contato da loja
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-2 text-lg font-bold hover:opacity-90"
            >
              <MessageCircle className="h-4 w-4" />
              {WHATSAPP_DISPLAY}
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-5 text-xs text-white/80 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {BRAND}. Todos os direitos reservados.</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="font-semibold uppercase tracking-wider">MVX Sistemas</span>
            <a
              href={MVX_INSTAGRAM}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram MVX Sistemas"
              className="inline-flex items-center gap-1.5 hover:text-white"
            >
              <Instagram className="h-3.5 w-3.5" />
              @mvx_sistemas
            </a>
            <a
              href={`https://wa.me/${MVX_WHATSAPP_1.link}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-white"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              {MVX_WHATSAPP_1.display}
            </a>
            <a
              href={`https://wa.me/${MVX_WHATSAPP_2.link}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-white"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              {MVX_WHATSAPP_2.display}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
