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
  variant?: "default" | "featured";
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
        variant === "featured"
          ? "gap-x-3 gap-y-3 sm:gap-x-6 sm:gap-y-8"
          : "gap-x-3 gap-y-3 sm:gap-x-4 sm:gap-y-8",
        className,
      )}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} variant={variant} />
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
