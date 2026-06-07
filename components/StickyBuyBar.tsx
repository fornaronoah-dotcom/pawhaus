"use client";

import Image from "next/image";
import { AddToCartButton } from "@/components/AddToCartButton";
import { formatPrice } from "@/lib/utils";
import type { Product, ProductVariant } from "@/lib/types";

/**
 * Meelopende koopbalk onderaan op mobiel (lg:hidden). Gebruikt de geselecteerde
 * variant uit ProductView; voegt 1 stuk toe via de bestaande AddToCartButton.
 */
export function StickyBuyBar({
  product,
  variant,
}: {
  product: Product;
  variant: ProductVariant | null;
}) {
  const price = variant?.price ?? product.priceRange.minVariantPrice;
  const available = variant ? variant.availableForSale : product.availableForSale;
  const img = variant?.image?.url ?? product.featuredImage?.url ?? null;

  return (
    <div className="bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t px-4 py-2.5 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        {img ? (
          <Image
            src={img}
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 rounded-lg object-cover ring-1 ring-foreground/10"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{product.title}</p>
          <p className="text-sm">{formatPrice(price)}</p>
        </div>
        <AddToCartButton
          variantId={variant?.id ?? null}
          availableForSale={available}
          quantity={1}
          className="shrink-0"
        />
      </div>
    </div>
  );
}
