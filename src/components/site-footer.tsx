import { BRAND, WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from "@/lib/config";
import { MessageCircle, Instagram, Mail } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-foreground text-background font-display text-lg font-semibold">
              A
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">
              {BRAND}
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Moda urbana com atendimento próximo. Peças selecionadas, pedidos
            finalizados diretamente pelo WhatsApp.
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground">
            Institucional
          </h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li className="cursor-pointer transition-colors hover:text-foreground">
              Sobre a marca
            </li>
            <li className="cursor-pointer transition-colors hover:text-foreground">
              Políticas de venda
            </li>
            <li className="cursor-pointer transition-colors hover:text-foreground">
              Privacidade
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground">
            Ajuda
          </h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li className="cursor-pointer transition-colors hover:text-foreground">
              Como comprar
            </li>
            <li className="cursor-pointer transition-colors hover:text-foreground">
              Trocas e devoluções
            </li>
            <li className="cursor-pointer transition-colors hover:text-foreground">
              Guia de tamanhos
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground">
            Contato
          </h4>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noreferrer"
            className="mb-3 inline-flex items-center gap-2 text-sm text-foreground transition-colors hover:text-brand"
          >
            <MessageCircle className="h-4 w-4" />
            {WHATSAPP_DISPLAY}
          </a>
          <div className="flex items-center gap-2 pt-1">
            <a
              href="#"
              className="grid h-9 w-9 place-items-center rounded-full border border-border transition-colors hover:border-foreground hover:bg-accent"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="#"
              className="grid h-9 w-9 place-items-center rounded-full border border-border transition-colors hover:border-foreground hover:bg-accent"
              aria-label="Email"
            >
              <Mail className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} {BRAND}. Todos os direitos reservados.</p>
          <p>Feito com cuidado no Brasil</p>
        </div>
      </div>
    </footer>
  );
}
