import "server-only";

import { shopifyAdminFetch } from "@/lib/shopify-admin";
import { ShopifyError } from "@/lib/shopify";

/**
 * Publiceren naar het Headless-verkoopkanaal (Storefront API). Vereist
 * read_publications (kanaal vinden) + write_publications (publiceren).
 */

const PUBLICATIONS_QUERY = /* GraphQL */ `
  query { publications(first: 25) { nodes { id name } } }
`;
const PUBLISHABLE_PUBLISH_MUTATION = /* GraphQL */ `
  mutation($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      userErrors { field message }
    }
  }
`;

export class PublicationScopeError extends Error {
  constructor() {
    super("De Shopify-app mist read_publications/write_publications.");
    this.name = "PublicationScopeError";
  }
}

function isAccessDenied(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /access denied|read_publications|write_publications/i.test(msg);
}

let cachedPubId: string | null = null;

/** Zoekt de id van het Headless/Storefront-verkoopkanaal (gecached). */
export async function getStorefrontPublicationId(): Promise<string> {
  if (cachedPubId) return cachedPubId;
  let data;
  try {
    data = await shopifyAdminFetch<{ publications: { nodes: { id: string; name: string }[] } }>({
      query: PUBLICATIONS_QUERY,
    });
  } catch (err) {
    if (err instanceof ShopifyError && isAccessDenied(err)) throw new PublicationScopeError();
    throw err;
  }
  const nodes = data.publications.nodes;
  const headless =
    nodes.find((n) => /headless/i.test(n.name)) ??
    nodes.find((n) => /storefront|hydrogen/i.test(n.name));
  if (!headless) throw new Error("Geen Headless-verkoopkanaal gevonden.");
  cachedPubId = headless.id;
  return headless.id;
}

/** Publiceert één product naar een publicatie. */
export async function publishToPublication(
  productGid: string,
  publicationId: string,
): Promise<{ ok: boolean; error?: string }> {
  const data = await shopifyAdminFetch<{
    publishablePublish: { userErrors: { field: string[] | null; message: string }[] };
  }>({
    query: PUBLISHABLE_PUBLISH_MUTATION,
    variables: { id: productGid, input: [{ publicationId }] },
  });
  const errs = data.publishablePublish.userErrors;
  if (errs.length) return { ok: false, error: errs.map((e) => e.message).join("; ") };
  return { ok: true };
}
