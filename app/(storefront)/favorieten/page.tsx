import type { Metadata } from "next";
import { FavoritesGrid } from "@/components/favorites/FavoritesGrid";
import { getProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Mijn favorieten — Pawhaus",
  description: "Jouw bewaarde producten bij Pawhaus.",
};

export default async function FavoritesPage() {
  // Alle producten ophalen; de client filtert op de favorieten-handles.
  const products = await getProducts({ first: 250 });

  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 pb-16 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[#0C2A5A] sm:text-4xl">
          Mijn favorieten
        </h1>
        <p className="mt-1 text-sm text-[#0C2A5A]/60">
          De producten die je hebt bewaard.
        </p>
      </header>

      <FavoritesGrid allProducts={products} />
    </div>
  );
}
