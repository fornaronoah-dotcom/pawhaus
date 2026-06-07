import type { ProductStatus } from "@/lib/admin-products";

const LABELS: Record<ProductStatus, { label: string; className: string }> = {
  ACTIVE: { label: "Actief", className: "bg-green-100 text-green-800" },
  DRAFT: { label: "Concept", className: "bg-amber-100 text-amber-800" },
  ARCHIVED: { label: "Gearchiveerd", className: "bg-muted text-muted-foreground" },
};

export function StatusBadge({ status }: { status: ProductStatus }) {
  const s = LABELS[status] ?? LABELS.DRAFT;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.className}`}
    >
      {s.label}
    </span>
  );
}
