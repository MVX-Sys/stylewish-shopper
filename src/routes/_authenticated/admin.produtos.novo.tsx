import { createFileRoute } from "@tanstack/react-router";
import { ProductForm } from "@/components/product-form";

export const Route = createFileRoute("/_authenticated/admin/produtos/novo")({
  component: () => (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Novo produto</h1>
      <ProductForm />
    </div>
  ),
});
