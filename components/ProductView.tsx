"use client";

import { useCallback, useState } from "react";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductInfo } from "@/components/ProductInfo";
import { StickyBuyBar } from "@/components/StickyBuyBar";
import type { Product, ProductImage, ProductVariant } from "@/lib/types";

/**
 * Bundelt galerij + productinfo + mobiele koopbalk en deelt de gekozen variant:
 * de galerij toont de variantfoto, de sticky bar gebruikt prijs/voorraad/variant.
 */
export function ProductView({
  product,
  images,
}: {
  product: Product;
  images: ProductImage[];
}) {
  const [variant, setVariant] = useState<ProductVariant | null>(null);
  const handleVariant = useCallback((v: ProductVariant | null) => setVariant(v), []);

  return (
    <>
      <div className="grid gap-6 sm:gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery images={images} title={product.title} activeUrl={variant?.image?.url ?? null} />
        <ProductInfo product={product} onVariantChange={handleVariant} />
      </div>
      <StickyBuyBar product={product} variant={variant} />
    </>
  );
}
