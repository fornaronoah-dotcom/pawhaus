import type { Metadata } from "next";
import { Search } from "lucide-react";
import { ProductGrid } from "@/components/ProductGrid";
import { ProductFilters } from "@/components/ProductFilters";
import { FilterSidebar } from "@/components/FilterSidebar";
import { MobileFilters } from "@/components/MobileFilters";
import { CategoryHero } from "@/components/CategoryHero";
import { EmptyState } from "@/components/EmptyState";
import { applyFacets, buildFacets, getProducts } from "@/lib/products";
import { SORT_OPTIONS, type SortKey } from "@/lib/types";

export const metadata: Metadata = {
  title: "Alle producten",
  description:
    "Ontdek ons volledige assortiment premium accessoires voor honden en katten.",
};

const VALID_SORTS = new Set(SORT_OPTIONS.map((o) => o.value));

function csv(value: string | string[] | undefined): string[] {
  return typeof value === "string" ? value.split(",").filter(Boolean) : [];
}

export default async function ProductenPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : "";
  const search = typeof params.search === "string" ? params.search : undefined;
  const sortParam = typeof params.sort === "string" ? params.sort : "featured";
  const sort: SortKey = VALID_SORTS.has(sortParam as SortKey)
    ? (sortParam as SortKey)
    : "featured";

  const types = csv(params.type);
  const brands = csv(params.merk);
  const colors = csv(params.kleur);
  const min = typeof params.min === "string" ? Number(params.min) : undefined;
  const max = typeof params.max === "string" ? Number(params.max) : undefined;

  // Alles binnen het gekozen dier/zoekterm → bepaalt facetten + tellingen;
  // daarna passen we de actieve facet-selectie toe.
  const all = await getProducts({ category, search, sort, first: 250 });
  const facets = buildFacets(all);
  const products = applyFacets(all, { types, brands, colors, min, max });

  return (
    <div>
      <CategoryHero
        category={category}
        search={search}
        count={products.length}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Bovenbalk: dier/subcategorie-chips + sorteren (+ mobiele filterknop) */}
        <div className="mb-5 sm:mb-6">
          <ProductFilters
            activeCategory={category}
            activeSort={sort}
            leading={<MobileFilters facets={facets} />}
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
          <aside className="hidden h-fit lg:sticky lg:top-24 lg:block">
            <FilterSidebar facets={facets} />
          </aside>

          <div>
            {products.length === 0 ? (
              <EmptyState
                icon={<Search className="size-6" />}
                title="Geen producten gevonden"
                description="Pas je filters of zoekterm aan om meer resultaten te zien."
                action={{ label: "Bekijk alle producten", href: "/producten" }}
              />
            ) : (
              <ProductGrid products={products} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
