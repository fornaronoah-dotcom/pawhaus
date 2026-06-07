"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Truck } from "lucide-react";
import { AddToCartButton } from "@/components/AddToCartButton";
import { QuantitySelector } from "@/components/QuantitySelector";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  cn,
  discountPercent,
  formatPrice,
  isOnSale,
} from "@/lib/utils";
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
  /** Meldt de gekozen variant aan de ouder (voor de galerij). */
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

  const selectedVariant = useMemo(
    () => product.variants.find((v) => variantMatches(v, selected)) ?? null,
    [product.variants, selected],
  );

  useEffect(() => {
    onVariantChange?.(selectedVariant);
  }, [selectedVariant, onVariantChange]);

  const price = selectedVariant?.price ?? product.priceRange.minVariantPrice;
  const compareAt =
    selectedVariant?.compareAtPrice ?? product.compareAtPrice;
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
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        {product.productType && (
          <p className="text-muted-foreground text-sm tracking-wide uppercase">
            {product.productType}
          </p>
        )}
        <h1 className="text-4xl font-semibold tracking-tight">
          {product.title}
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-medium">{formatPrice(price)}</span>
          {onSale && compareAt && (
            <>
              <span className="text-muted-foreground text-lg line-through">
                {formatPrice(compareAt)}
              </span>
              <Badge className="bg-brand text-brand-foreground border-transparent">
                −{discountPercent(price, compareAt)}%
              </Badge>
            </>
          )}
        </div>
      </div>

      <Separator />

      {/* Opties */}
      {hasOptions && (
        <div className="space-y-5">
          {product.options.map((option) => (
            <div key={option.id} className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{option.name}</span>
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
                        "rounded-lg border px-4 py-2 text-sm transition-colors",
                        isActive
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-foreground/40",
                        !enabled &&
                          "text-muted-foreground line-through opacity-50 hover:border-border",
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
          "flex items-center gap-2 text-sm",
          available ? "text-foreground" : "text-muted-foreground",
        )}
      >
        <span
          className={cn(
            "size-2 rounded-full",
            available ? "bg-teal" : "bg-muted-foreground",
          )}
        />
        {available ? "Op voorraad" : "Tijdelijk uitverkocht"}
      </p>

      {/* Aantal + toevoegen */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <QuantitySelector
          value={quantity}
          onChange={setQuantity}
          disabled={!available}
          className="h-12"
        />
        <AddToCartButton
          variantId={selectedVariant?.id ?? null}
          availableForSale={available}
          quantity={quantity}
          className="sm:flex-1"
        />
      </div>

      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        <Truck className="size-4" />
        Gratis verzending vanaf € 50 · levering 2–4 werkdagen
      </p>

      {/* Beschrijving */}
      {product.descriptionHtml && (
        <>
          <Separator />
          <div
            className="prose-sm text-muted-foreground max-w-none space-y-3 text-sm leading-relaxed [&_a]:underline [&_strong]:text-foreground"
            dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
          />
        </>
      )}

      <ul className="text-muted-foreground space-y-1 text-sm">
        <li className="flex items-center gap-2">
          <Check className="size-4" /> Veilig betalen via Shopify
        </li>
        <li className="flex items-center gap-2">
          <Check className="size-4" /> 30 dagen retourrecht
        </li>
      </ul>
    </div>
  );
}
