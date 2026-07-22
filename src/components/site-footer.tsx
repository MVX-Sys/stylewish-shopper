import { BRAND, WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from "@/lib/config";
import { MessageCircle, Instagram, Package, Truck, ShoppingCart, ArrowDown, Phone } from "lucide-react";

const MVX_INSTAGRAM = "https://www.instagram.com/mvx_sistemas/";
const MVX_WHATSAPP_1 = { display: "(87) 99168-6116", link: "5587991686116" };
const MVX_WHATSAPP_2 = { display: "(87) 99748-0691", link: "5587997480691" };

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-primary text-primary-foreground sm:mt-20">
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 sm:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-12">
          {/* Brand + selling points */}
          <div className="lg:col-span-2">
            <span className="font-display text-3xl font-extrabold tracking-tight">
              acha&amp;busca
            </span>

            <ul className="mt-6 space-y-3 text-sm sm:text-base">
              <li className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 backdrop-blur">
                  <Package className="h-4 w-4" />
                </span>
                <span className="font-medium tracking-wide">
                  FABRICAÇÃO PRÓPRIA E PRIVATE LABEL
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 backdrop-blur">
                  <Truck className="h-4 w-4" />
                </span>
                <span className="font-medium tracking-wide">
                  ENVIAMOS PARA TODO O BRASIL
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 backdrop-blur">
                  <ShoppingCart className="h-4 w-4" />
                </span>
                <span className="font-medium tracking-wide">
                  PEDIDO MÍNIMO — 10 PEÇAS
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 backdrop-blur">
                  <ArrowDown className="h-4 w-4" />
                </span>
                <span className="font-medium tracking-wide">
                  Orçamentos e pedidos no link abaixo
                </span>
              </li>
            </ul>
          </div>

          {/* Contact card */}
          <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm ring-1 ring-white/15">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em]">
              Contato da loja
            </h4>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-primary shadow-sm transition-transform hover:scale-[1.02]"
            >
              <MessageCircle className="h-5 w-5" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/70">
                  Falar no WhatsApp
                </span>
                <span className="text-sm font-bold">{WHATSAPP_DISPLAY}</span>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/15 bg-black/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 md:flex-row md:items-start md:justify-between">
          <p className="text-xs text-white/80">
            © {new Date().getFullYear()} {BRAND}. Todos os direitos reservados.
          </p>

          <div className="text-xs text-white/90">
            <p className="mb-3 font-bold uppercase tracking-[0.18em]">
              Sistema criado pela MVX Sistemas
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={MVX_INSTAGRAM}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram MVX Sistemas"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-3 py-1.5 transition-colors hover:border-white hover:bg-white hover:text-primary"
              >
                <Instagram className="h-3.5 w-3.5" />
                <span className="font-medium">@mvx_sistemas</span>
              </a>
              <a
                href={`https://wa.me/${MVX_WHATSAPP_1.link}`}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp 1 MVX Sistemas"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-3 py-1.5 transition-colors hover:border-white hover:bg-white hover:text-primary"
              >
                <Phone className="h-3.5 w-3.5" />
                <span className="font-medium">{MVX_WHATSAPP_1.display}</span>
              </a>
              <a
                href={`https://wa.me/${MVX_WHATSAPP_2.link}`}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp 2 MVX Sistemas"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-3 py-1.5 transition-colors hover:border-white hover:bg-white hover:text-primary"
              >
                <Phone className="h-3.5 w-3.5" />
                <span className="font-medium">{MVX_WHATSAPP_2.display}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
