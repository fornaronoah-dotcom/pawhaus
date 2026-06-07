/**
 * Genormaliseerde, frontend-vriendelijke types.
 * De ruwe Shopify-respons (met edges/nodes) wordt in `products.ts` / `cart.ts`
 * platgeslagen naar deze vormen, zodat de UI niet met GraphQL-randen werkt.
 */

export type Money = {
  amount: string;
  currencyCode: string;
};

export type ProductImage = {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
};

export type SelectedOption = {
  name: string;
  value: string;
};

export type ProductOption = {
  id: string;
  name: string;
  values: string[];
};

export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: Money;
  compareAtPrice: Money | null;
  selectedOptions: SelectedOption[];
  image?: ProductImage | null;
  sku?: string | null;
};

export type Product = {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  featuredImage: ProductImage | null;
  images: ProductImage[];
  priceRange: {
    minVariantPrice: Money;
    maxVariantPrice: Money;
  };
  compareAtPrice: Money | null;
  options: ProductOption[];
  variants: ProductVariant[];
  availableForSale: boolean;
  tags: string[];
  productType: string;
  vendor: string;
  updatedAt: string;
};

export type Collection = {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: ProductImage | null;
};

export type CartLine = {
  id: string;
  quantity: number;
  cost: {
    totalAmount: Money;
  };
  merchandise: {
    id: string;
    title: string;
    selectedOptions: SelectedOption[];
    product: {
      handle: string;
      title: string;
      featuredImage: ProductImage | null;
    };
  };
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: Money;
    totalAmount: Money;
  };
  lines: CartLine[];
};

/** Sorteeropties voor het productoverzicht. */
export type SortKey = "featured" | "price-asc" | "price-desc" | "newest";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Aanbevolen" },
  { value: "newest", label: "Nieuwste" },
  { value: "price-asc", label: "Prijs: laag → hoog" },
  { value: "price-desc", label: "Prijs: hoog → laag" },
];

/** Vriendelijke subcategorie (bundeling van Shopify-producttypes). */
export type ProductCategory = { key: string; label: string };

/** Eén filteroptie in de facet-zijbalk. */
export type FacetOption = {
  value: string;
  label: string;
  count: number;
  /** Hex-kleur voor kleur-swatches. */
  hex?: string;
};

/** Beschikbare facetten + tellingen voor de huidige scope (dier/zoekterm). */
export type Facets = {
  categories: FacetOption[];
  brands: FacetOption[];
  colors: FacetOption[];
  priceMin: number;
  priceMax: number;
};

/** Actieve facet-selectie (uit de URL). */
export type FacetSelection = {
  types: string[];
  brands: string[];
  colors: string[];
  min?: number;
  max?: number;
};
