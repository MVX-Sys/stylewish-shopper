import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

export function LoginParaVerPreco({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/auth"
      className={`inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20 ${className}`}
    >
      <Lock className="h-4 w-4" />
      Entre na sua conta para ver o preço
    </Link>
  );
}
