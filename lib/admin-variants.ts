import "server-only";

import { shopifyAdminFetch } from "@/lib/shopify-admin";

/**
 * Varianten van één product (prijs + voorraad bewerken). Prijs via
 * productVariantsBulkUpdate (write_products — al toegekend); voorraad via
 * inventorySetQuantities (vereist write_inventory → InventoryScopeError tot
 * de scope is toegevoegd).
 */

export class InventoryScopeError extends Error {
  constructor() {
    super("Scope write_inventory ontbreekt");
    this.name = "InventoryScopeError";
  }
}

export type AdminVariant = {
  id: string;
  title: string;
  price: string;
  inventoryQuantity: number | null;
  inventoryItemId: string | null;
  tracked: boolean;
  options: string;
};

export type ProductVariantsResult = {
  variants: AdminVariant[];
  locationId: string | null;
};

const VARIANTS_QUERY = /* GraphQL */ `
  query ProductVariants($id: ID!) {
    product(id: $id) {
      id
      variants(first: 100) {
        nodes {
          id
          title
          price
          inventoryQuantity
          inventoryItem { id tracked }
          selectedOptions { name value }
        }
      }
    }
    locations(first: 5) { nodes { id name isActive } }
  }
`;

type RawVariantsResp = {
  product: {
    variants: {
      nodes: {
        id: string;
        title: string;
        price: string;
        inventoryQuantity: number | null;
        inventoryItem: { id: string; tracked: boolean } | null;
        selectedOptions: { name: string; value: string }[];
      }[];
    };
  } | null;
  locations: { nodes: { id: string; name: string; isActive: boolean }[] };
};

export async function getProductVariants(
  productGid: string,
): Promise<ProductVariantsResult> {
  const data = await shopifyAdminFetch<RawVariantsResp>({
    query: VARIANTS_QUERY,
    variables: { id: productGid },
  });
  const nodes = data.product?.variants.nodes ?? [];
  const loc =
    data.locations.nodes.find((l) => l.isActive) ?? data.locations.nodes[0];

  return {
    locationId: loc?.id ?? null,
    variants: nodes.map((v) => ({
      id: v.id,
      title: v.title,
      price: v.price,
      inventoryQuantity: v.inventoryQuantity,
      inventoryItemId: v.inventoryItem?.id ?? null,
      tracked: v.inventoryItem?.tracked ?? false,
      options:
        v.selectedOptions.map((o) => o.value).join(" / ") || v.title || "Standaard",
    })),
  };
}

const PRICE_MUTATION = /* GraphQL */ `
  mutation VariantPrice($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      userErrors { field message }
    }
  }
`;

export async function updateVariantPriceQuery(
  productGid: string,
  variantId: string,
  price: string,
): Promise<{ ok: boolean; error?: string }> {
  const data = await shopifyAdminFetch<{
    productVariantsBulkUpdate: { userErrors: { message: string }[] };
  }>({
    query: PRICE_MUTATION,
    variables: { productId: productGid, variants: [{ id: variantId, price }] },
  });
  const errs = data.productVariantsBulkUpdate.userErrors;
  return errs.length ? { ok: false, error: errs[0].message } : { ok: true };
}

const INVENTORY_MUTATION = /* GraphQL */ `
  mutation InventorySet($input: InventorySetQuantitiesInput!) {
    inventorySetQuantities(input: $input) {
      userErrors { field message }
    }
  }
`;

export async function setInventoryQuery(
  inventoryItemId: string,
  locationId: string,
  quantity: number,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const data = await shopifyAdminFetch<{
      inventorySetQuantities: { userErrors: { message: string }[] };
    }>({
      query: INVENTORY_MUTATION,
      variables: {
        input: {
          name: "available",
          reason: "correction",
          ignoreCompareQuantity: true,
          quantities: [{ inventoryItemId, locationId, quantity }],
        },
      },
    });
    const errs = data.inventorySetQuantities.userErrors;
    return errs.length ? { ok: false, error: errs[0].message } : { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (/write_inventory|access denied/i.test(msg)) throw new InventoryScopeError();
    throw err;
  }
}
