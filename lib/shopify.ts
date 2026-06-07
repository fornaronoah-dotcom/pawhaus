import "server-only";

/**
 * Lichtgewicht Shopify Storefront API-client.
 * Pure `fetch` naar het GraphQL-endpoint — geen extra client-library nodig.
 */

const domain = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, "");
const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const apiVersion = process.env.SHOPIFY_API_VERSION ?? "2025-01";

/** True wanneer er voldoende env-variabelen zijn om Shopify te bevragen. */
export const isShopifyConfigured = Boolean(domain && token);

const endpoint = domain
  ? `https://${domain}/api/${apiVersion}/graphql.json`
  : "";

/** Standaard cache-duur (in seconden) voor product-data. */
export const DEFAULT_REVALIDATE = 60 * 15; // 15 minuten

export class ShopifyError extends Error {
  constructor(
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ShopifyError";
  }
}

type ShopifyFetchOptions<V> = {
  query: string;
  variables?: V;
  /** ISR-revalidatie in seconden. Gebruik `cache: "no-store"` voor cart. */
  revalidate?: number;
  cache?: RequestCache;
  tags?: string[];
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

export async function shopifyFetch<T, V = Record<string, unknown>>({
  query,
  variables,
  revalidate = DEFAULT_REVALIDATE,
  cache,
  tags,
}: ShopifyFetchOptions<V>): Promise<T> {
  if (!isShopifyConfigured) {
    throw new ShopifyError(
      "Shopify is niet geconfigureerd. Stel SHOPIFY_STORE_DOMAIN en " +
        "SHOPIFY_STOREFRONT_ACCESS_TOKEN in (zie .env.example).",
    );
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token as string,
      },
      body: JSON.stringify({ query, variables }),
      ...(cache ? { cache } : { next: { revalidate, tags } }),
    });
  } catch (error) {
    throw new ShopifyError(
      "Kon Shopify niet bereiken. Controleer je netwerk en het store-domein.",
      error,
    );
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new ShopifyError(
      `Shopify gaf status ${response.status} terug. Controleer je ` +
        `access token en API-versie (${apiVersion}).`,
      text,
    );
  }

  const json = (await response.json()) as GraphQLResponse<T>;

  if (json.errors?.length) {
    throw new ShopifyError(
      `Shopify GraphQL-fout: ${json.errors.map((e) => e.message).join("; ")}`,
      json.errors,
    );
  }

  if (!json.data) {
    throw new ShopifyError("Shopify gaf een lege respons terug.", json);
  }

  return json.data;
}
