import "server-only";

import { ShopifyError } from "@/lib/shopify";

/**
 * Shopify ADMIN GraphQL-client (schrijftoegang).
 * Zusje van lib/shopify.ts (Storefront, read-only), maar:
 *   - ander endpoint: /admin/api/<version>/graphql.json
 *   - andere header:  X-Shopify-Access-Token (GEHEIME custom-app token)
 *   - altijd live (cache: "no-store") — admin leest nooit uit ISR-cache
 *   - rate limiting is COST-based → retry-with-backoff op THROTTLED
 *
 * BELANGRIJK: deze token is krachtig. Enkel server-side, nooit naar de browser.
 */

// Accepteer beide naamgevingen: SHOPIFY_SHOP_DOMAIN (admin) of de bestaande
// SHOPIFY_STORE_DOMAIN (storefront) — zo breekt niets.
const domain = (
  process.env.SHOPIFY_SHOP_DOMAIN ?? process.env.SHOPIFY_STORE_DOMAIN
)?.replace(/^https?:\/\//, "");
const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const apiVersion = process.env.SHOPIFY_ADMIN_API_VERSION ?? "2025-01";

/** True wanneer de Admin API bruikbaar is (domein + admin-token aanwezig). */
export const isAdminConfigured = Boolean(domain && adminToken);

/** Welke verplichte env-variabelen ontbreken (voor een duidelijke melding). */
export function missingAdminConfig(): string[] {
  const missing: string[] = [];
  if (!adminToken) missing.push("SHOPIFY_ADMIN_ACCESS_TOKEN");
  if (!domain) missing.push("SHOPIFY_SHOP_DOMAIN of SHOPIFY_STORE_DOMAIN");
  return missing;
}

const endpoint = domain
  ? `https://${domain}/admin/api/${apiVersion}/graphql.json`
  : "";

type AdminFetchOptions<V> = {
  query: string;
  variables?: V;
  /** Aantal retries bij THROTTLED (default 3). */
  retries?: number;
};

type GraphQLError = {
  message: string;
  extensions?: { code?: string };
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: GraphQLError[];
  extensions?: {
    cost?: {
      requestedQueryCost: number;
      throttleStatus: {
        maximumAvailable: number;
        currentlyAvailable: number;
        restoreRate: number;
      };
    };
  };
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function shopifyAdminFetch<T, V = Record<string, unknown>>({
  query,
  variables,
  retries = 3,
}: AdminFetchOptions<V>): Promise<T> {
  if (!isAdminConfigured) {
    throw new ShopifyError(
      "Shopify Admin API is niet geconfigureerd. Stel SHOPIFY_ADMIN_ACCESS_TOKEN " +
        "in (custom app, zie .env.example).",
    );
  }

  for (let attempt = 0; ; attempt++) {
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": adminToken as string,
        },
        body: JSON.stringify({ query, variables }),
        cache: "no-store",
      });
    } catch (error) {
      throw new ShopifyError(
        "Kon de Shopify Admin API niet bereiken. Controleer netwerk en domein.",
        error,
      );
    }

    // 429 = throttled op HTTP-niveau → backoff en opnieuw.
    if (response.status === 429 && attempt < retries) {
      const retryAfter = Number(response.headers.get("Retry-After")) || 1;
      await sleep(retryAfter * 1000);
      continue;
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new ShopifyError(
        `Shopify Admin gaf status ${response.status} terug. Controleer token ` +
          `en scopes (API-versie ${apiVersion}).`,
        text,
      );
    }

    const json = (await response.json()) as GraphQLResponse<T>;

    // GraphQL-niveau throttling (cost-based).
    const throttled = json.errors?.some(
      (e) => e.extensions?.code === "THROTTLED",
    );
    if (throttled && attempt < retries) {
      const status = json.extensions?.cost?.throttleStatus;
      const needed = json.extensions?.cost?.requestedQueryCost ?? 100;
      const restore = status?.restoreRate ?? 50;
      const waitMs = Math.max(500, (needed / restore) * 1000);
      await sleep(waitMs);
      continue;
    }

    if (json.errors?.length) {
      throw new ShopifyError(
        `Shopify Admin GraphQL-fout: ${json.errors
          .map((e) => e.message)
          .join("; ")}`,
        json.errors,
      );
    }

    if (!json.data) {
      throw new ShopifyError("Shopify Admin gaf een lege respons terug.", json);
    }

    return json.data;
  }
}

/** Totaal aantal producten (voor het dashboard). */
export async function getAdminProductCount(): Promise<number> {
  const data = await shopifyAdminFetch<{ productsCount: { count: number } }>({
    query: `query { productsCount { count } }`,
  });
  return data.productsCount.count;
}
