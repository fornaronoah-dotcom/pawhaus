"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { useFavorites } from "@/components/favorites/favorites-context";
import type { Product } from "@/lib/types";

/**
 * Toont de favoriete producten van de bezoeker. De favorieten-handles komen uit
 * de FavoritesProvider (localStorage voor gasten, server voor ingelogden); de
 * bijbehorende productdata krijgen we als `allProducts` van de server-pagina.
 */
export function FavoritesGrid({ allProducts }: { allProducts: Product[] }) {
  const { favorites, hydrated } = useFavorites();

  // Vóór hydration weten we de localStorage-favorieten nog niet → niets tonen
  // (voorkomt een flits van "leeg" of verkeerde inhoud).
  if (!hydrated) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/4] animate-pulse rounded-3xl bg-black/5"
          />
        ))}
      </div>
    );
  }

  const byHandle = new Map(allProducts.map((p) => [p.handle, p]));
  const products = favorites
    .map((handle) => byHandle.get(handle))
    .filter((p): p is Product => Boolean(p));

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-black/5 bg-white py-16 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-[#FFE3D3]">
          <Heart className="size-7 text-[#e0533f]" />
        </span>
        <div>
          <p className="text-lg font-semibold text-[#0C2A5A]">
            Nog geen favorieten
          </p>
          <p className="mt-1 text-sm text-[#0C2A5A]/60">
            Tik op het hartje bij een product om het hier te bewaren.
          </p>
        </div>
        <Link
          href="/producten"
          className="mt-2 rounded-full bg-[#e0533f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#cf4736]"
        >
          Ontdek producten
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
