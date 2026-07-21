import { createFileRoute } from "@tanstack/react-router";
import { ProductForm } from "@/components/product-form";

export const Route = createFileRoute("/_authenticated/admin/produtos/$id")({
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Editar produto</h1>
      <ProductForm produtoId={id} />
    </div>
  );
}
