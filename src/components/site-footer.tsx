import { BRAND, WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from "@/lib/config";
import { MessageCircle, Instagram } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-primary text-primary-foreground sm:mt-20">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <div>
          <span className="font-display text-2xl font-extrabold tracking-tight">
            acha&amp;busca
          </span>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80">
            Atacado com atendimento próximo. Peças selecionadas, pedidos
            finalizados diretamente pelo WhatsApp.
          </p>
        </div>

        <div className="mt-8">
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-white">
            Contato da loja
          </h4>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-white transition-opacity hover:opacity-80"
          >
            <MessageCircle className="h-4 w-4" />
            {WHATSAPP_DISPLAY}
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-white/80">
          <p>© {new Date().getFullYear()} {BRAND}. Todos os direitos reservados.</p>
          <div className="mt-4 space-y-1">
            <p className="font-semibold text-white">SISTEMA CRIADO PELA MVX SISTEMAS</p>
            <p className="flex items-center gap-2">
              <Instagram className="h-3.5 w-3.5" />
              <a
                href="https://www.instagram.com/mvx_sistemas/"
                target="_blank"
                rel="noreferrer"
                className="hover:opacity-80"
              >
                https://www.instagram.com/mvx_sistemas/
              </a>
            </p>
            <p className="flex items-center gap-2">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>Whatsapp 1: (87) 99168-6116</span>
            </p>
            <p className="flex items-center gap-2">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>Whatsapp 2: (87) 99748-0691</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
