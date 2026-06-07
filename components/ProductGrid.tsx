import { ProductCard } from "@/components/ProductCard";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

export function ProductGrid({
  products,
  className,
  variant = "default",
}: {
  products: Product[];
  className?: string;
  variant?: "default" | "polaroid";
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
        variant === "polaroid"
          ? "gap-x-5 gap-y-10 sm:gap-x-6"
          : "gap-x-4 gap-y-8",
        className,
      )}
    >
      {products.map((product, i) => (
        <ProductCard
          key={product.id}
          product={product}
          variant={variant}
          index={i}
        />
      ))}
    </div>
  );
}

/** Skeleton-variant voor laadtoestanden. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="bg-muted aspect-square animate-pulse rounded-xl" />
          <div className="bg-muted h-3 w-1/3 animate-pulse rounded" />
          <div className="bg-muted h-3 w-2/3 animate-pulse rounded" />
          <div className="bg-muted h-3 w-1/4 animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}
