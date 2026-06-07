"use client";

import { Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-context";
import { cn } from "@/lib/utils";

type AddToCartButtonProps = {
  variantId: string | null;
  availableForSale: boolean;
  quantity?: number;
  className?: string;
};

export function AddToCartButton({
  variantId,
  availableForSale,
  quantity = 1,
  className,
}: AddToCartButtonProps) {
  const { addItem, isPending } = useCart();

  const disabled = !availableForSale || !variantId || isPending;

  const label = !availableForSale
    ? "Uitverkocht"
    : !variantId
      ? "Kies een variant"
      : "In winkelmand";

  return (
    <Button
      type="button"
      size="lg"
      disabled={disabled}
      onClick={() => variantId && addItem(variantId, quantity)}
      className={cn("h-12 w-full text-sm", className)}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <ShoppingBag className="size-4" />
      )}
      {label}
    </Button>
  );
}
