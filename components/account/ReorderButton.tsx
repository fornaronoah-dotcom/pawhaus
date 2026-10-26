"use client";

import { RotateCcw } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";

/**
 * "Opnieuw bestellen" — voegt de variant-ids van een eerdere bestelling toe aan
 * de winkelmand (met respect voor de aantallen). Uitgeschakeld als geen enkele
 * regel een (nog bestaand) variant-id heeft.
 */
export function ReorderButton({
  items,
}: {
  items: Array<{ variantId: string | null; quantity: number }>;
}) {
  const { addItems } = useCart();
  const ids = items
    .filter((i) => i.variantId)
    .flatMap((i) => Array<string>(Math.max(1, i.quantity)).fill(i.variantId!));
  const disabled = ids.length === 0;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => addItems(ids)}
      className="inline-flex items-center gap-2 rounded-full border border-[#0C2A5A]/15 px-4 py-2 text-sm font-semibold text-[#0C2A5A] transition hover:bg-[#0C2A5A]/5 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <RotateCcw className="size-4" />
      Opnieuw bestellen
    </button>
  );
}
