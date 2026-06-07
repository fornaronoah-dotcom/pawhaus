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

/** Lichte, afwisselende rotaties voor de polaroid-variant (scrapbook-gevoel). */
const POLAROID_ROTATIONS = ["-2deg", "1.5deg", "-1deg", "2deg"];

export function ProductCard({
  product,
  className,
  variant = "default",
  index = 0,
}: {
  product: Product;
  className?: string;
  variant?: "default" | "polaroid";
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

  if (variant === "polaroid") {
    const rotation = POLAROID_ROTATIONS[index % POLAROID_ROTATIONS.length];
    return (
      <Link
        href={`/product/${product.handle}`}
        style={{ "--r": rotation } as React.CSSProperties}
        className={cn(
          "group focus-visible:ring-ring/50 relative block rounded-[3px] bg-white p-3 pb-2 shadow-[0_12px_30px_rgba(12,42,90,0.13)] ring-1 ring-black/5 outline-none",
          "[transform:rotate(var(--r))] transition-[transform,box-shadow] duration-300 ease-out",
          "hover:z-10 hover:[transform:rotate(0deg)_translateY(-6px)] hover:shadow-[0_20px_44px_rgba(12,42,90,0.2)]",
          "focus-visible:z-10 focus-visible:[transform:rotate(0deg)] focus-visible:ring-2",
          className,
        )}
      >
        <div className="bg-muted relative aspect-square overflow-hidden rounded-[2px]">
          {image ? (
            <Image
              src={image.url}
              alt={image.altText ?? product.title}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized={image.url.endsWith(".svg")}
            />
          ) : null}

          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {bestseller && (
              <Badge className="gap-1 border-transparent bg-[#e0533f] text-white">
                <Flame className="size-3" />
                Best verkocht
              </Badge>
            )}
            {onSale && product.compareAtPrice && (
              <Badge className="bg-brand text-brand-foreground border-transparent">
                −{discountPercent(price, product.compareAtPrice)}%
              </Badge>
            )}
            {soldOut && <Badge variant="secondary">Uitverkocht</Badge>}
          </div>

          <FavoriteButton
            title={product.title}
            className="absolute top-3 right-3"
          />
        </div>

        {/* Handgeschreven 'bijschrift' onderaan de polaroid */}
        <div className="px-1 pt-2.5 pb-1">
          <h3 className="font-hand text-xl leading-tight text-[#0C2A5A] transition-colors group-hover:text-[#e0533f]">
            {product.title}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-sm">
            <span className="font-semibold text-[#0C2A5A]">
              {formatPrice(price)}
            </span>
            {onSale && product.compareAtPrice && (
              <span className="text-[#0C2A5A]/50 line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>
          <QuickAddButton
            variantId={variantId}
            availableForSale={!soldOut}
            className="mt-2.5"
          />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/product/${product.handle}`}
      className={cn(
        "group focus-visible:ring-ring/50 block rounded-2xl outline-none transition-transform duration-300 ease-out hover:-translate-y-1 focus-visible:ring-2",
        className,
      )}
    >
      <div className="bg-muted relative aspect-square overflow-hidden rounded-2xl ring-1 ring-black/5">
        {image ? (
          <Image
            src={image.url}
            alt={image.altText ?? product.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
            unoptimized={image.url.endsWith(".svg")}
          />
        ) : null}

        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {bestseller && (
            <Badge className="gap-1 border-transparent bg-[#e0533f] text-white">
              <Flame className="size-3" />
              Best verkocht
            </Badge>
          )}
          {onSale && product.compareAtPrice && (
            <Badge className="bg-brand text-brand-foreground border-transparent">
              −{discountPercent(price, product.compareAtPrice)}%
            </Badge>
          )}
          {fresh && !onSale && (
            <Badge className="bg-brand text-brand-foreground border-transparent">
              Nieuw
            </Badge>
          )}
          {soldOut && <Badge variant="secondary">Uitverkocht</Badge>}
        </div>

        <FavoriteButton
          title={product.title}
          className="absolute top-3 right-3"
        />
      </div>

      <div className="mt-3 space-y-1">
        {product.productType && (
          <p className="text-xs tracking-wide text-[#0C2A5A]/50 uppercase">
            {product.productType}
          </p>
        )}
        <h3 className="text-sm font-semibold text-[#0C2A5A] transition-colors group-hover:text-[#e0533f]">
          {product.title}
        </h3>

        {swatches.length > 0 && (
          <div className="flex items-center gap-1.5 pt-0.5">
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

        <div className="flex items-end justify-between gap-2 pt-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-[#0C2A5A]">
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
          />
        </div>
      </div>
    </Link>
  );
}
