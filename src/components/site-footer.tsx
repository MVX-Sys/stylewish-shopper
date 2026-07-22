import { BRAND, WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from "@/lib/config";
import { MessageCircle, Instagram, Mail } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-primary text-primary-foreground sm:mt-20">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-2 sm:gap-10 sm:py-14">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground font-display text-lg font-bold">
              a&amp;b
            </div>
            <span className="font-display text-lg font-extrabold tracking-tight">
              acha&amp;busca
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
            Atacado com atendimento próximo. Peças selecionadas, pedidos
            finalizados diretamente pelo WhatsApp.
          </p>
        </div>


        <div>
          <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">
            Contato
          </h4>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noreferrer"
            className="mb-3 inline-flex items-center gap-2 text-sm text-white transition-colors hover:text-primary"
          >
            <MessageCircle className="h-4 w-4" />
            {WHATSAPP_DISPLAY}
          </a>
          <div className="flex items-center gap-2 pt-1">
            <a
              href="#"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/20 text-white transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="#"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/20 text-white transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
              aria-label="Email"
            >
              <Mail className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-white/60 sm:flex-row">
          <p>© {new Date().getFullYear()} {BRAND}. Todos os direitos reservados.</p>
          <p>FEITO PELA MVX SISTEMAS</p>
        </div>
      </div>
    </footer>
  );
}
