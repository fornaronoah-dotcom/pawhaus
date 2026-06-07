import "server-only";

import { shopifyAdminFetch } from "@/lib/shopify-admin";
import {
  ADMIN_PRODUCTS_QUERY,
  ADMIN_PRODUCT_QUERY,
  ADMIN_PRODUCT_UPDATE_MUTATION,
  ADMIN_TAGS_ADD_MUTATION,
  ADMIN_TAGS_REMOVE_MUTATION,
  ADMIN_PRODUCT_SET_STATUS_MUTATION,
  ADMIN_REORDER_MEDIA_MUTATION,
} from "@/lib/admin-queries";
import type { Money, ProductImage } from "@/lib/types";
import type { OptStatus } from "@/lib/db/schema";

/**
 * Admin-productlaag. Leest ALTIJD live uit de Shopify Admin API (Shopify =
 * bron van waarheid) en schrijft wijzigingen terug. Niets wordt lokaal als
 * bron bewaard.
 */

export type ProductStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";

export type AdminProductListItem = {
  id: string; // gid://shopify/Product/123
  numericId: string; // 123
  title: string;
  handle: string;
  status: ProductStatus;
  totalInventory: number;
  updatedAt: string;
  tags: string[];
  vendor: string;
  productType: string;
  sku: string | null;
  image: ProductImage | null;
  hasImage: boolean;
  hasDescription: boolean;
  minPrice: Money | null;
  adviesprijs: Money | null; // compareAtPrice van de eerste variant
  unitCost: Money | null; // inkoopprijs (indien beschikbaar)
  marginPct: number | null; // marge % t.o.v. verkoopprijs
};

/** Lijstitem verrijkt met de optimalisatie-status uit Postgres. */
export type AdminProductRow = AdminProductListItem & { optStatus: OptStatus };

export type AdminMedia = { id: string; url: string; altText: string | null };

export type AdminProductDetail = AdminProductListItem & {
  description: string;
  descriptionHtml: string;
  seoTitle: string;
  seoDescription: string;
  media: AdminMedia[];
  maxPrice: Money | null;
};

/* ------------------------------- helpers ------------------------------- */

/** Haalt het numerieke id uit een Shopify gid. */
export function numericIdFromGid(gid: string): string {
  return gid.split("/").pop() ?? gid;
}

/** Bouwt een Product-gid uit een numeriek id. */
export function productGid(numericId: string): string {
  return `gid://shopify/Product/${numericId}`;
}

/* ------------------------------- ruwe vormen --------------------------- */

type RawVariant = {
  sku: string | null;
  compareAtPrice: string | null;
  inventoryItem: { unitCost: Money | null } | null;
};

type RawListNode = {
  id: string;
  title: string;
  handle: string;
  status: ProductStatus;
  totalInventory: number;
  updatedAt: string;
  tags: string[];
  description: string;
  vendor: string;
  productType: string;
  featuredImage: ProductImage | null;
  priceRangeV2: { minVariantPrice: Money } | null;
  variants: { edges: { node: RawVariant }[] };
};

function normalizeListItem(node: RawListNode): AdminProductListItem {
  const minPrice = node.priceRangeV2?.minVariantPrice ?? null;
  const variant = node.variants?.edges[0]?.node ?? null;

  const currency = minPrice?.currencyCode ?? "EUR";
  const adviesprijs =
    variant?.compareAtPrice != null && Number(variant.compareAtPrice) > 0
      ? { amount: variant.compareAtPrice, currencyCode: currency }
      : null;
  const unitCost = variant?.inventoryItem?.unitCost ?? null;

  let marginPct: number | null = null;
  if (minPrice && unitCost) {
    const price = Number(minPrice.amount);
    const cost = Number(unitCost.amount);
    if (price > 0 && cost >= 0) {
      marginPct = Math.round(((price - cost) / price) * 100);
    }
  }

  return {
    id: node.id,
    numericId: numericIdFromGid(node.id),
    title: node.title,
    handle: node.handle,
    status: node.status,
    totalInventory: node.totalInventory ?? 0,
    updatedAt: node.updatedAt,
    tags: node.tags ?? [],
    vendor: node.vendor ?? "",
    productType: node.productType ?? "",
    sku: variant?.sku ?? null,
    image: node.featuredImage,
    hasImage: Boolean(node.featuredImage?.url),
    hasDescription: Boolean(node.description && node.description.trim()),
    minPrice,
    adviesprijs,
    unitCost,
    marginPct,
  };
}

/* ------------------------------ lees-API ------------------------------- */

const PAGE_SIZE = 250; // Admin API-maximum per pagina.
const DEFAULT_MAX = 1000; // veiligheidscap voor het Control Center.

/**
 * Haalt producten LIVE uit Shopify, gepagineerd tot `max`. Optioneel een
 * Shopify search-query (bv. "tag:nieuw-product OR tag:klaar-voor-ai").
 * Zoeken/sorteren/filteren gebeurt verder client-side in het Control Center.
 */
export async function fetchAdminProducts(opts?: {
  query?: string;
  max?: number;
}): Promise<{ items: AdminProductListItem[]; hasMore: boolean }> {
  const max = opts?.max ?? DEFAULT_MAX;
  const items: AdminProductListItem[] = [];
  let after: string | null = null;
  let hasMore = false;

  while (items.length < max) {
    const data: {
      products: {
        edges: { node: RawListNode }[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    } = await shopifyAdminFetch({
      query: ADMIN_PRODUCTS_QUERY,
      variables: {
        first: Math.min(PAGE_SIZE, max - items.length),
        after,
        query: opts?.query ?? undefined,
        sortKey: "UPDATED_AT",
        reverse: true,
      },
    });

    for (const edge of data.products.edges) {
      items.push(normalizeListItem(edge.node));
    }

    if (data.products.pageInfo.hasNextPage) {
      after = data.products.pageInfo.endCursor;
      if (items.length >= max) {
        hasMore = true;
        break;
      }
    } else {
      break;
    }
  }

  return { items, hasMore };
}

type RawDetail = RawListNode & {
  descriptionHtml: string;
  seo: { title: string | null; description: string | null } | null;
  media: {
    edges: { node: { id?: string; image?: ProductImage | null } }[];
  };
  priceRangeV2: { minVariantPrice: Money; maxVariantPrice: Money } | null;
};

export async function getAdminProduct(
  numericId: string,
): Promise<AdminProductDetail | null> {
  const data = await shopifyAdminFetch<{ product: RawDetail | null }>({
    query: ADMIN_PRODUCT_QUERY,
    variables: { id: productGid(numericId) },
  });

  const node = data.product;
  if (!node) return null;

  const base = normalizeListItem(node);
  const media: AdminMedia[] = node.media.edges
    .map((e) => e.node)
    .filter((n): n is { id: string; image: ProductImage } =>
      Boolean(n.id && n.image?.url),
    )
    .map((n) => ({
      id: n.id,
      url: n.image.url,
      altText: n.image.altText,
    }));

  return {
    ...base,
    description: node.description ?? "",
    descriptionHtml: node.descriptionHtml ?? "",
    seoTitle: node.seo?.title ?? "",
    seoDescription: node.seo?.description ?? "",
    media,
    maxPrice: node.priceRangeV2?.maxVariantPrice ?? null,
  };
}

/* ------------------------------ schrijf-API ---------------------------- */

export type ProductUpdateFields = {
  title?: string;
  descriptionHtml?: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
};

export type UpdateResult =
  | { ok: true; handle: string }
  | { ok: false; error: string };

type UserError = { field: string[] | null; message: string };

function errResult(userErrors: UserError[]): { ok: false; error: string } {
  return { ok: false, error: userErrors.map((e) => e.message).join("; ") };
}

/**
 * Schrijft basisvelden terug naar Shopify via productUpdate. Enkel de
 * meegegeven velden worden gewijzigd. Geeft het handle terug (voor
 * cache-revalidatie van de storefront).
 */
export async function updateAdminProduct(
  numericId: string,
  fields: ProductUpdateFields,
): Promise<UpdateResult> {
  const product: Record<string, unknown> = { id: productGid(numericId) };

  if (fields.title !== undefined) product.title = fields.title;
  if (fields.descriptionHtml !== undefined)
    product.descriptionHtml = fields.descriptionHtml;
  if (fields.tags !== undefined) product.tags = fields.tags;
  if (fields.seoTitle !== undefined || fields.seoDescription !== undefined) {
    product.seo = {
      title: fields.seoTitle ?? "",
      description: fields.seoDescription ?? "",
    };
  }

  const data = await shopifyAdminFetch<{
    productUpdate: { product: { handle: string } | null; userErrors: UserError[] };
  }>({ query: ADMIN_PRODUCT_UPDATE_MUTATION, variables: { product } });

  const { product: updated, userErrors } = data.productUpdate;
  if (userErrors.length) return errResult(userErrors);
  if (!updated) return { ok: false, error: "Shopify gaf geen product terug." };
  return { ok: true, handle: updated.handle };
}

/** Voegt tags toe aan één product (Shopify = bron). */
export async function addProductTags(
  gid: string,
  tags: string[],
): Promise<{ ok: boolean; error?: string }> {
  const data = await shopifyAdminFetch<{
    tagsAdd: { userErrors: UserError[] };
  }>({ query: ADMIN_TAGS_ADD_MUTATION, variables: { id: gid, tags } });
  if (data.tagsAdd.userErrors.length) return errResult(data.tagsAdd.userErrors);
  return { ok: true };
}

/** Verwijdert tags van één product. */
export async function removeProductTags(
  gid: string,
  tags: string[],
): Promise<{ ok: boolean; error?: string }> {
  const data = await shopifyAdminFetch<{
    tagsRemove: { userErrors: UserError[] };
  }>({ query: ADMIN_TAGS_REMOVE_MUTATION, variables: { id: gid, tags } });
  if (data.tagsRemove.userErrors.length)
    return errResult(data.tagsRemove.userErrors);
  return { ok: true };
}

/** Zet de Shopify-status (ACTIVE/DRAFT/ARCHIVED) van één product. */
export async function setProductShopifyStatus(
  numericId: string,
  status: ProductStatus,
): Promise<UpdateResult> {
  const data = await shopifyAdminFetch<{
    productUpdate: { product: { handle: string } | null; userErrors: UserError[] };
  }>({
    query: ADMIN_PRODUCT_SET_STATUS_MUTATION,
    variables: { product: { id: productGid(numericId), status } },
  });
  const { product: updated, userErrors } = data.productUpdate;
  if (userErrors.length) return errResult(userErrors);
  if (!updated) return { ok: false, error: "Shopify gaf geen product terug." };
  return { ok: true, handle: updated.handle };
}

/** Maakt het gekozen media-item de hoofdafbeelding (positie 0). */
export async function setMainImage(
  numericId: string,
  mediaId: string,
): Promise<{ ok: boolean; error?: string }> {
  const data = await shopifyAdminFetch<{
    productReorderMedia: { userErrors: UserError[] };
  }>({
    query: ADMIN_REORDER_MEDIA_MUTATION,
    variables: {
      id: productGid(numericId),
      moves: [{ id: mediaId, newPosition: "0" }],
    },
  });
  if (data.productReorderMedia.userErrors.length)
    return errResult(data.productReorderMedia.userErrors);
  return { ok: true };
}
