import "server-only";

import { shopifyAdminFetch } from "@/lib/shopify-admin";
import {
  BUNDLE_COMPONENT_OPTIONS_QUERY,
  BUNDLE_CREATE_MUTATION,
  BUNDLE_OPERATION_QUERY,
  BUNDLE_VARIANT_PRICE_MUTATION,
} from "@/lib/admin-bundle-queries";
import {
  fetchAdminProducts,
  addProductTags,
  numericIdFromGid,
  type AdminProductListItem,
} from "@/lib/admin-products";

export const BUNDLE_TAG = "bundel";

export type BundleItem = { productGid: string; quantity: number };

export type CreateBundleResult =
  | { ok: true; numericId: string; handle: string }
  | { ok: false; error: string };

type UserError = { field: string[] | null; message: string };

function errsToMsg(errs: UserError[]): string {
  return errs.map((e) => e.message).join("; ");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Lijst van bestaande bundels (producten met tag "bundel"). */
export async function listBundles(): Promise<AdminProductListItem[]> {
  const { items } = await fetchAdminProducts({
    query: `tag:${BUNDLE_TAG}`,
    max: 250,
  });
  return items;
}

/**
 * Maakt een Shopify fixed-bundle. Async: poll de operation tot COMPLETE.
 * Voegt tag "bundel" toe en zet optioneel een eigen bundelprijs (korting).
 */
export async function createBundle(input: {
  title: string;
  items: BundleItem[];
  price?: string | null;
}): Promise<CreateBundleResult> {
  if (input.items.length < 2) {
    return { ok: false, error: "Een bundel heeft minstens 2 producten nodig." };
  }

  // 1. Optieselecties per component ophalen (optie-ID + waarde van 1e variant).
  const optData = await shopifyAdminFetch<{
    nodes: ({
      id: string;
      options: { id: string; name: string }[];
      variants: { nodes: { selectedOptions: { name: string; value: string }[] }[] };
    } | null)[];
  }>({
    query: BUNDLE_COMPONENT_OPTIONS_QUERY,
    variables: { ids: input.items.map((i) => i.productGid) },
  });

  type Selection = { componentOptionId: string; name: string; values: string[] };
  const selByGid = new Map<string, Selection[]>();
  for (const node of optData.nodes) {
    if (!node) continue;
    const variantOpts = node.variants.nodes[0]?.selectedOptions ?? [];
    const valueByName = new Map(variantOpts.map((o) => [o.name, o.value]));
    selByGid.set(
      node.id,
      node.options.map((opt) => ({
        componentOptionId: opt.id,
        name: opt.name,
        values: [valueByName.get(opt.name) ?? ""],
      })),
    );
  }

  const components = input.items.map((it) => ({
    productId: it.productGid,
    quantity: it.quantity,
    optionSelections: selByGid.get(it.productGid) ?? [],
  }));

  if (components.some((c) => c.optionSelections.length === 0)) {
    return { ok: false, error: "Kon de productopties niet bepalen voor een onderdeel." };
  }

  // 2. Bundel aanmaken (async).
  const created = await shopifyAdminFetch<{
    productBundleCreate: {
      productBundleOperation: { id: string; status: string } | null;
      userErrors: UserError[];
    };
  }>({
    query: BUNDLE_CREATE_MUTATION,
    variables: { input: { title: input.title, components } },
  });

  if (created.productBundleCreate.userErrors.length)
    return { ok: false, error: errsToMsg(created.productBundleCreate.userErrors) };
  const opId = created.productBundleCreate.productBundleOperation?.id;
  if (!opId) return { ok: false, error: "Geen bundel-operatie ontvangen." };

  // 3. Pollen tot COMPLETE.
  let productGid: string | null = null;
  let handle = "";
  let variantId: string | null = null;
  for (let i = 0; i < 20; i++) {
    const poll = await shopifyAdminFetch<{
      productOperation: {
        status: string;
        product: { id: string; handle: string; variants: { nodes: { id: string }[] } } | null;
        userErrors: UserError[];
      } | null;
    }>({ query: BUNDLE_OPERATION_QUERY, variables: { id: opId } });

    const op = poll.productOperation;
    if (op?.userErrors?.length) return { ok: false, error: errsToMsg(op.userErrors) };
    if (op?.status === "COMPLETE" && op.product) {
      productGid = op.product.id;
      handle = op.product.handle;
      variantId = op.product.variants.nodes[0]?.id ?? null;
      break;
    }
    await sleep(1000);
  }

  if (!productGid) return { ok: false, error: "Bundel-creatie duurde te lang (time-out)." };

  // 4. Tag toevoegen (best-effort).
  await addProductTags(productGid, [BUNDLE_TAG]).catch(() => {});

  // 5. Optionele bundelprijs (korting).
  if (input.price && Number(input.price) > 0 && variantId) {
    await shopifyAdminFetch({
      query: BUNDLE_VARIANT_PRICE_MUTATION,
      variables: {
        productId: productGid,
        variants: [{ id: variantId, price: input.price }],
      },
    }).catch(() => {});
  }

  return { ok: true, numericId: numericIdFromGid(productGid), handle };
}
