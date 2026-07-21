import { BRAND, WHATSAPP_DISPLAY } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-muted/30">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <h4 className="mb-3 text-sm font-semibold">Sobre</h4>
          <p className="text-sm text-muted-foreground">
            {BRAND} — moda urbana com atendimento próximo e pedidos via WhatsApp.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Recursos</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Políticas de venda</li>
            <li>Políticas de privacidade</li>
            <li>Trocas e devoluções</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Contato</h4>
          <p className="text-sm text-muted-foreground">
            WhatsApp: <span className="text-foreground">{WHATSAPP_DISPLAY}</span>
          </p>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {BRAND}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
