import Image from "next/image";
import Link from "next/link";
import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton, QuickAddButton } from "@/components/ProductCardActions";
import type { Product } from "@/lib/types";
import {
  cn,
  colorHex,
  discountPercent,
  formatPrice,
  isBestseller,
  isNew,
  isOnSale,
  productColors,
} from "@/lib/utils";

export function ProductCard({
  product,
  className,
}: {
  product: Product;
  className?: string;
  /** Behouden voor API-compat; alle kaarten delen nu dezelfde stijl. */
  variant?: "default" | "featured";
  /** Genegeerd; sommige aanroepers geven een index mee. */
  index?: number;
}) {
  const price = product.priceRange.minVariantPrice;
  const onSale = isOnSale(price, product.compareAtPrice);
  const soldOut = !product.availableForSale;
  const image = product.featuredImage;
  const bestseller = isBestseller(product.handle);
  const variantId = product.variants[0]?.id ?? null;
  const swatches = productColors(product);
  const fresh = isNew(product.updatedAt);

  return (
    <Link
      href={`/product/${product.handle}`}
      className={cn(
        "group focus-visible:ring-ring/50 flex h-full flex-col rounded-2xl bg-white p-2 sm:rounded-3xl sm:p-3 shadow-[0_8px_24px_rgba(12,42,90,0.06)] ring-1 ring-black/[0.08] outline-none transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_18px_40px_rgba(12,42,90,0.13)] focus-visible:ring-2",
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden rounded-xl sm:rounded-2xl">
        {image ? (
          <Image
            src={image.url}
            alt={image.altText ?? product.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-contain p-3 transition-transform sm:p-4 duration-500 ease-out group-hover:scale-105"
            unoptimized={image.url.endsWith(".svg")}
          />
        ) : null}

        <div className="absolute top-2 left-2 flex flex-col items-start gap-1.5 sm:top-2.5 sm:left-2.5">
          {bestseller && (
            <Badge className="gap-1 border-transparent bg-[#e0533f] text-white">
              <Flame className="size-3" />
              {/* Kort label op mobiel, zodat het niet onder het hartje loopt */}
              <span className="sm:hidden">Top</span>
              <span className="hidden sm:inline">Best verkocht</span>
            </Badge>
          )}
          {onSale && product.compareAtPrice && (
            <Badge className="border-transparent bg-[#f3b340] text-[#0C2A5A]">
              −{discountPercent(price, product.compareAtPrice)}%
            </Badge>
          )}
          {fresh && !onSale && !bestseller && (
            <Badge className="bg-brand text-brand-foreground border-transparent">
              Nieuw
            </Badge>
          )}
          {soldOut && <Badge variant="secondary">Uitverkocht</Badge>}
        </div>

        <FavoriteButton
          handle={product.handle}
          className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5"
        />
      </div>

      <div className="flex flex-1 flex-col px-1.5 pt-2.5 pb-1 sm:pt-3">
        {swatches.length > 0 && (
          <div className="mb-1.5 flex items-center gap-1.5">
            {swatches.slice(0, 4).map((c) => (
              <span
                key={c}
                title={c}
                className="size-3.5 rounded-full border border-black/10"
                style={{ backgroundColor: colorHex(c) }}
              />
            ))}
            {swatches.length > 4 && (
              <span className="text-[10px] text-[#0C2A5A]/50">
                +{swatches.length - 4}
              </span>
            )}
          </div>
        )}

        <h3 className="line-clamp-2 text-sm leading-snug sm:text-[15px] font-semibold text-[#0C2A5A] transition-colors group-hover:text-[#e0533f]">
          {product.title}
        </h3>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2.5 sm:pt-3">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 text-sm">
            <span className="font-bold text-[#0C2A5A]">
              {formatPrice(price)}
            </span>
            {onSale && product.compareAtPrice && (
              <span className="text-[#0C2A5A]/45 line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>
          <QuickAddButton
            variantId={variantId}
            availableForSale={!soldOut}
            round
            className="size-9 sm:size-10"
          />
        </div>
      </div>
    </Link>
  );
}
