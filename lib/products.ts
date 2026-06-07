import "server-only";

import {
  GET_COLLECTIONS_QUERY,
  GET_PRODUCT_BY_HANDLE_QUERY,
  GET_PRODUCT_HANDLES_QUERY,
  GET_PRODUCTS_QUERY,
} from "@/lib/queries";
import { isShopifyConfigured, shopifyFetch } from "@/lib/shopify";
import { MOCK_COLLECTIONS, MOCK_PRODUCTS } from "@/lib/mock";
import { colorHex, productColors } from "@/lib/utils";
import type {
  Collection,
  Facets,
  FacetOption,
  FacetSelection,
  Product,
  ProductCategory,
  ProductImage,
  SortKey,
} from "@/lib/types";

/**
 * Producten die we NIET op de site tonen (bv. "assorti" zonder kleurkeuze).
 * Ze blijven in Shopify bestaan; dit verbergt ze alleen in de storefront.
 * Echte verwijdering = in Shopify depubliceren/verwijderen.
 */
const HIDDEN_HANDLES = new Set<string>([
  "trixie-voer-dummy-lente-assorti",
  "trixie-dummy-lente-drijvend-assorti",
]);

function excludeHidden(products: Product[]): Product[] {
  return products.filter((p) => !HIDDEN_HANDLES.has(p.handle));
}

/**
 * Bundelt de (granulaire) Shopify-`productType` in vriendelijke subcategorieën,
 * bv. "SNACKS KOEK" → Snacks, "DROOGVOER" → Voeding. Regel-gebaseerd zodat
 * nieuwe producttypes automatisch in de juiste groep vallen.
 */
const CATEGORY_RULES: {
  key: string;
  label: string;
  test: RegExp;
}[] = [
  { key: "snacks", label: "Snacks", test: /SNACK|KAUW|BEEN/ },
  { key: "voeding", label: "Voeding", test: /DROOGVOER|NATVOER|VOEDING|BROK/ },
  // Kattenbak(ken) + vulling MOET vóór de generieke /BAK/-regel staan,
  // anders pakt "Voer- & drinkbakken" per ongeluk "kattenBAK".
  { key: "kattenbak", label: "Kattenbakken", test: /KATTENBAK/ },
  { key: "krabpalen", label: "Krabpalen", test: /KRAB/ },
  { key: "bakken", label: "Voer- & drinkbakken", test: /BAK/ },
  { key: "manden", label: "Manden & kussens", test: /BED|MAND|KUSSEN|SLAAP/ },
  { key: "speelgoed", label: "Speelgoed", test: /SPEEL|DUMMY|BAL/ },
  { key: "verzorging", label: "Verzorging", test: /VERZORG|HYGI|VACHT|PADS|SHAMPOO/ },
];

export function productCategory(productType: string): ProductCategory {
  const t = (productType || "").toUpperCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.test.test(t)) return { key: rule.key, label: rule.label };
  }
  return { key: "accessoires", label: "Accessoires" };
}

/** De subcategorieën die daadwerkelijk in deze productenlijst voorkomen, op vaste volgorde. */
export function availableCategories(products: Product[]): ProductCategory[] {
  const order = [...CATEGORY_RULES.map((r) => r.key), "accessoires"];
  const seen = new Map<string, ProductCategory>();
  for (const p of products) {
    const c = productCategory(p.productType);
    if (!seen.has(c.key)) seen.set(c.key, c);
  }
  return [...seen.values()].sort(
    (a, b) => order.indexOf(a.key) - order.indexOf(b.key),
  );
}

/** Bouwt de beschikbare facetten + tellingen voor een (dier/zoek-)scope. */
export function buildFacets(products: Product[]): Facets {
  const order = [...CATEGORY_RULES.map((r) => r.key), "accessoires"];

  const catCount = new Map<string, FacetOption>();
  const brandCount = new Map<string, FacetOption>();
  const colorCount = new Map<string, FacetOption>();
  let priceMin = Infinity;
  let priceMax = 0;

  for (const p of products) {
    const price = Number(p.priceRange.minVariantPrice.amount);
    if (price < priceMin) priceMin = price;
    if (price > priceMax) priceMax = price;

    const c = productCategory(p.productType);
    const cat = catCount.get(c.key) ?? { value: c.key, label: c.label, count: 0 };
    cat.count++;
    catCount.set(c.key, cat);

    if (p.vendor) {
      const key = p.vendor.toLowerCase();
      const b = brandCount.get(key) ?? { value: key, label: p.vendor, count: 0 };
      b.count++;
      brandCount.set(key, b);
    }

    for (const color of productColors(p)) {
      const key = color.toLowerCase();
      const col =
        colorCount.get(key) ??
        ({ value: key, label: color, count: 0, hex: colorHex(color) } as FacetOption);
      col.count++;
      colorCount.set(key, col);
    }
  }

  return {
    categories: [...catCount.values()].sort(
      (a, b) => order.indexOf(a.value) - order.indexOf(b.value),
    ),
    brands: [...brandCount.values()].sort((a, b) => b.count - a.count),
    colors: [...colorCount.values()].sort((a, b) => b.count - a.count),
    priceMin: Number.isFinite(priceMin) ? Math.floor(priceMin) : 0,
    priceMax: Math.ceil(priceMax),
  };
}

/** Past de actieve facet-selectie toe op een productenlijst. */
export function applyFacets(
  products: Product[],
  sel: FacetSelection,
): Product[] {
  return products.filter((p) => {
    if (
      sel.types.length &&
      !sel.types.includes(productCategory(p.productType).key)
    )
      return false;
    if (sel.brands.length && !sel.brands.includes((p.vendor || "").toLowerCase()))
      return false;
    if (sel.colors.length) {
      const colors = productColors(p).map((c) => c.toLowerCase());
      if (!colors.some((c) => sel.colors.includes(c))) return false;
    }
    const price = Number(p.priceRange.minVariantPrice.amount);
    if (sel.min != null && price < sel.min) return false;
    if (sel.max != null && price > sel.max) return false;
    return true;
  });
}

/* --------------------------- Ruwe Shopify-vormen ----------------------- */

type Edges<T> = { edges: { node: T }[] };
type RawImage = ProductImage;
type RawProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  tags: string[];
  productType: string;
  vendor: string;
  updatedAt: string;
  availableForSale: boolean;
  featuredImage: RawImage | null;
  images: Edges<RawImage>;
  priceRange: Product["priceRange"];
  compareAtPriceRange: { minVariantPrice: Product["compareAtPrice"] } | null;
  options: { id: string; name: string; optionValues: { name: string }[] }[];
  variants: Edges<{
    id: string;
    title: string;
    sku: string | null;
    availableForSale: boolean;
    selectedOptions: { name: string; value: string }[];
    price: { amount: string; currencyCode: string };
    compareAtPrice: { amount: string; currencyCode: string } | null;
    image: RawImage | null;
  }>;
};

function normalizeProduct(node: RawProduct): Product {
  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    description: node.description,
    descriptionHtml: node.descriptionHtml,
    featuredImage: node.featuredImage,
    images: node.images.edges.map((e) => e.node),
    priceRange: node.priceRange,
    compareAtPrice: node.compareAtPriceRange?.minVariantPrice ?? null,
    options: node.options.map((o) => ({
      id: o.id,
      name: o.name,
      values: o.optionValues.map((v) => v.name),
    })),
    variants: node.variants.edges.map((e) => e.node),
    availableForSale: node.availableForSale,
    tags: node.tags,
    productType: node.productType,
    vendor: node.vendor,
    updatedAt: node.updatedAt,
  };
}

/* ------------------------------- Sortering ----------------------------- */

const SORT_MAP: Record<SortKey, { sortKey: string; reverse: boolean }> = {
  featured: { sortKey: "BEST_SELLING", reverse: false },
  newest: { sortKey: "CREATED_AT", reverse: true },
  "price-asc": { sortKey: "PRICE", reverse: false },
  "price-desc": { sortKey: "PRICE", reverse: true },
};

function sortMockProducts(products: Product[], sort: SortKey): Product[] {
  const copy = [...products];
  const price = (p: Product) => Number(p.priceRange.minVariantPrice.amount);
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => price(a) - price(b));
    case "price-desc":
      return copy.sort((a, b) => price(b) - price(a));
    case "newest":
      return copy.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    default:
      return copy;
  }
}

/* ------------------------------ Publieke API --------------------------- */

export type GetProductsParams = {
  sort?: SortKey;
  /** Categorie-tag, bv. "hond" of "kat". */
  category?: string;
  /** Vrije zoekterm. */
  search?: string;
  first?: number;
};

export async function getProducts({
  sort = "featured",
  category,
  search,
  first = 50,
}: GetProductsParams = {}): Promise<Product[]> {
  if (!isShopifyConfigured) {
    let products = MOCK_PRODUCTS;
    if (category) {
      products = products.filter((p) => p.tags.includes(category));
    }
    if (search) {
      const term = search.toLowerCase();
      products = products.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          p.productType.toLowerCase().includes(term),
      );
    }
    return excludeHidden(sortMockProducts(products, sort));
  }

  const queryParts: string[] = [];
  if (category) queryParts.push(`tag:${category}`);
  if (search) queryParts.push(search);
  const { sortKey, reverse } = SORT_MAP[sort];

  const data = await shopifyFetch<{ products: Edges<RawProduct> }>({
    query: GET_PRODUCTS_QUERY,
    variables: {
      first,
      sortKey,
      reverse,
      query: queryParts.join(" ") || undefined,
    },
    tags: ["products"],
  });

  return excludeHidden(data.products.edges.map((e) => normalizeProduct(e.node)));
}

export async function getProduct(handle: string): Promise<Product | null> {
  if (HIDDEN_HANDLES.has(handle)) return null;

  if (!isShopifyConfigured) {
    return MOCK_PRODUCTS.find((p) => p.handle === handle) ?? null;
  }

  const data = await shopifyFetch<{ product: RawProduct | null }>({
    query: GET_PRODUCT_BY_HANDLE_QUERY,
    variables: { handle },
    tags: ["products", `product:${handle}`],
  });

  return data.product ? normalizeProduct(data.product) : null;
}

export async function getProductHandles(first = 100): Promise<string[]> {
  if (!isShopifyConfigured) {
    return MOCK_PRODUCTS.map((p) => p.handle);
  }

  const data = await shopifyFetch<{ products: Edges<{ handle: string }> }>({
    query: GET_PRODUCT_HANDLES_QUERY,
    variables: { first },
    tags: ["products"],
  });

  return data.products.edges.map((e) => e.node.handle);
}

export async function getCollections(): Promise<Collection[]> {
  if (!isShopifyConfigured) {
    return MOCK_COLLECTIONS;
  }

  const data = await shopifyFetch<{ collections: Edges<Collection> }>({
    query: GET_COLLECTIONS_QUERY,
    variables: { first: 20 },
    tags: ["collections"],
  });

  return data.collections.edges.map((e) => e.node);
}

/** Een handvol producten voor de homepage. */
export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  const products = await getProducts({ sort: "featured", first: limit });
  return products.slice(0, limit);
}
