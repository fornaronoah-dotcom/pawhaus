import { ChevronDown } from "lucide-react";
import { dierFromTags, parseInhoud, parseAfmetingen } from "@/lib/product-meta";
import type { Product } from "@/lib/types";

function prettyType(t: string): string {
  if (!t) return "";
  return t
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Specificaties als uitklapbare sectie, afgeleid uit bestaande productdata
 * (merk, dier-tag, SKU) + lichte parse van de beschrijving (inhoud, afmetingen).
 * Toont enkel rijen met een waarde.
 */
export function ProductSpecs({
  product,
  sku,
}: {
  product: Product;
  sku: string | null;
}) {
  const rows: [string, string | null][] = [
    ["Merk", product.vendor || null],
    ["Geschikt voor", dierFromTags(product.tags)],
    ["Inhoud", parseInhoud(product.descriptionHtml)],
    ["Afmetingen", parseAfmetingen(product.descriptionHtml)],
    ["Type", product.productType ? prettyType(product.productType) : null],
    ["SKU", sku || null],
  ].filter(([, v]) => Boolean(v)) as [string, string][];

  if (rows.length === 0) return null;

  return (
    <details className="group border-b py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
        Specificaties
        <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <dl className="mt-2 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 border-b border-dashed py-1.5 last:border-0">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="text-right font-medium">{v}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
