"use client";

import { useEffect, useState } from "react";
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

  // Pas tonen zodra de hoofd-koopknop (#pdp-buy) boven uit beeld is gescrold.
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const target = document.getElementById("pdp-buy");
    if (!target) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      return;
    }
    // Scroll-listener i.p.v. IntersectionObserver: die mist sprongen (fling,
    // anker) waarbij de knop in één keer van onder naar boven uit beeld gaat.
    const update = () => setVisible(target.getBoundingClientRect().bottom < 0);
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      data-sticky-buybar
      aria-hidden={!visible}
      inert={!visible}
      className={`bg-background/95 fixed inset-x-0 bottom-0 z-40 mb-0 border-t px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(12,42,90,0.08)] backdrop-blur transition-transform duration-300 ease-out lg:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
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
          <p className="text-sm font-semibold">{formatPrice(price)}</p>
        </div>
        <AddToCartButton
          variantId={variant?.id ?? null}
          availableForSale={available}
          quantity={1}
          className="h-11 w-auto shrink-0 rounded-full px-5"
        />
      </div>
    </div>
  );
}
