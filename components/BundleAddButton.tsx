"use client";

import { Loader2, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { cn } from "@/lib/utils";

export function BundleAddButton({
  variantIds,
  className,
}: {
  variantIds: string[];
  className?: string;
}) {
  const { addItems, isPending } = useCart();
  const disabled = isPending || variantIds.length === 0;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => addItems(variantIds)}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0C2A5A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#11356f] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <ShoppingBag className="size-4" />
      )}
      Bundel in winkelmand
    </button>
  );
}
