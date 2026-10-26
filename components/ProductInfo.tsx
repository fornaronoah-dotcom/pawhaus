"use client";

import { useEffect, useMemo, useState } from "react";
import { Headphones, Heart, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { AddToCartButton } from "@/components/AddToCartButton";
import { useFavorites } from "@/components/favorites/favorites-context";
import { QuantitySelector } from "@/components/QuantitySelector";
import { Badge } from "@/components/ui/badge";
import { cn, discountPercent, formatPrice, isOnSale } from "@/lib/utils";
import type { Product, ProductVariant } from "@/lib/types";

function variantMatches(
  variant: ProductVariant,
  selected: Record<string, string>,
) {
  return variant.selectedOptions.every(
    (option) => selected[option.name] === option.value,
  );
}

export function ProductInfo({
  product,
  onVariantChange,
}: {
  product: Product;
  /** Meldt de gekozen variant aan de ouder (voor de galerij + sticky bar). */
  onVariantChange?: (variant: ProductVariant | null) => void;
}) {
  const hasOptions = product.options.some((o) => o.values.length > 0);

  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const first = product.variants[0];
    if (!first) return {};
    return Object.fromEntries(
      first.selectedOptions.map((o) => [o.name, o.value]),
    );
  });
  const [quantity, setQuantity] = useState(1);
  const { isFavorite, toggle: toggleFavorite } = useFavorites();
  const fav = isFavorite(product.handle);

  const selectedVariant = useMemo(
    () => product.variants.find((v) => variantMatches(v, selected)) ?? null,
    [product.variants, selected],
  );

  useEffect(() => {
    onVariantChange?.(selectedVariant);
  }, [selectedVariant, onVariantChange]);

  const price = selectedVariant?.price ?? product.priceRange.minVariantPrice;
  const compareAt = selectedVariant?.compareAtPrice ?? product.compareAtPrice;
  const onSale = isOnSale(price, compareAt);
  const available = selectedVariant
    ? selectedVariant.availableForSale
    : product.availableForSale;

  /** Is er, bij de huidige overige selecties, een beschikbare variant met deze waarde? */
  function isValueAvailable(optionName: string, value: string) {
    const candidate = { ...selected, [optionName]: value };
    return product.variants.some(
      (v) => variantMatches(v, candidate) && v.availableForSale,
    );
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <div className="space-y-2 sm:space-y-3">
        {product.productType && (
          <p className="text-primary text-xs font-semibold tracking-[0.18em] uppercase">
            {product.productType}
          </p>
        )}
        <h1 className="font-poppins text-2xl leading-tight font-semibold tracking-tight sm:text-4xl">
          {product.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-primary text-[1.75rem] leading-none font-semibold sm:text-3xl">
            {formatPrice(price)}
          </span>
          {onSale && compareAt && (
            <>
              <span className="text-muted-foreground text-lg leading-none line-through">
                {formatPrice(compareAt)}
              </span>
              <Badge className="bg-brand text-brand-foreground border-transparent">
                −{discountPercent(price, compareAt)}%
              </Badge>
            </>
          )}
        </div>
        <p className="text-muted-foreground text-xs">Inclusief btw</p>
      </div>

      {/* Variant-pills */}
      {hasOptions && (
        <div className="space-y-4">
          {product.options.map((option) => (
            <div key={option.id} className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{option.name}:</span>
                <span className="text-muted-foreground">
                  {selected[option.name]}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {option.values.map((value) => {
                  const isActive = selected[option.name] === value;
                  const enabled = isValueAvailable(option.name, value);
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={!enabled}
                      onClick={() =>
                        setSelected((prev) => ({
                          ...prev,
                          [option.name]: value,
                        }))
                      }
                      className={cn(
                        "min-h-10 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 sm:px-5",
                        isActive
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-white hover:border-primary/50 hover:-translate-y-0.5",
                        !enabled &&
                          "text-muted-foreground line-through opacity-50 hover:translate-y-0 hover:border-border",
                      )}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Voorraadstatus */}
      <p
        className={cn(
          "flex items-center gap-2 text-sm font-medium",
          available ? "text-teal" : "text-muted-foreground",
        )}
      >
        <span
          className={cn(
            "size-2.5 rounded-full",
            available ? "bg-teal animate-pulse" : "bg-muted-foreground",
          )}
        />
        {available ? "Op voorraad" : "Tijdelijk uitverkocht"}
      </p>

      {/* Aantal + toevoegen + favoriet — op mobiel ook op één rij */}
      <div id="pdp-buy" className="flex items-center gap-2 sm:gap-3">
        <QuantitySelector
          value={quantity}
          onChange={setQuantity}
          disabled={!available}
          className="h-12 shrink-0 rounded-full"
        />
        <AddToCartButton
          variantId={selectedVariant?.id ?? null}
          availableForSale={available}
          quantity={quantity}
          className="min-w-0 flex-1 rounded-full"
        />
        <button
          type="button"
          aria-pressed={fav}
          aria-label={fav ? "Verwijder uit favorieten" : "Voeg toe aan favorieten"}
          onClick={() => toggleFavorite(product.handle)}
          className="border-border hover:border-primary/50 grid size-12 shrink-0 place-items-center rounded-full border transition hover:-translate-y-0.5"
        >
          <Heart
            className={cn(
              "size-5 transition-colors",
              fav ? "fill-primary text-primary" : "text-foreground/70",
            )}
          />
        </button>
      </div>

      {/* Levering (zonder kader) */}
      <div className="flex items-center gap-3">
        <Truck className="text-sky size-5 shrink-0" />
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-medium">Gratis verzending vanaf € 75</p>
          <p className="text-muted-foreground">
            Voor 15:00 besteld, vandaag verzonden
          </p>
        </div>
      </div>

      {/* Trust-rij */}
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-4 text-xs sm:gap-x-6">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="size-4" /> Veilig betalen
        </span>
        <span className="flex items-center gap-1.5">
          <RotateCcw className="size-4" /> 14 dagen retour
        </span>
        <span className="flex items-center gap-1.5">
          <Headphones className="size-4" /> Klantenservice
        </span>
      </div>
    </div>
  );
}
