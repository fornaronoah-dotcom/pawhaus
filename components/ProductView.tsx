"use client";

import { useCallback, useState } from "react";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductInfo } from "@/components/ProductInfo";
import type { Product, ProductImage, ProductVariant } from "@/lib/types";

/**
 * Bundelt galerij + productinfo zodat de hoofdfoto meeswitcht met de gekozen
 * variant (de variantkeuze leeft in ProductInfo, de galerij reageert erop).
 */
export function ProductView({
  product,
  images,
}: {
  product: Product;
  images: ProductImage[];
}) {
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

  const handleVariant = useCallback((v: ProductVariant | null) => {
    setActiveUrl(v?.image?.url ?? null);
  }, []);

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
      <ProductGallery images={images} title={product.title} activeUrl={activeUrl} />
      <ProductInfo product={product} onVariantChange={handleVariant} />
    </div>
  );
}
