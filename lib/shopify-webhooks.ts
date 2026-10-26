import crypto from "node:crypto";

/**
 * Shopify-webhook helpers: HMAC-verificatie, de te registreren topics en de
 * topic→cache-tag mapping. Bewust GEEN `server-only`-import zodat zowel de
 * route-handler als het registratie-script (tsx) dit kunnen delen.
 */

/** Eén webhook-topic: header-vorm (products/update) + GraphQL-enum (PRODUCTS_UPDATE). */
export type WebhookTopic = { header: string; gql: string };

/**
 * Topics die we abonneren. Productwijzigingen + collecties + voorraad raken de
 * storefront-cache; daarom verversen we die direct (i.p.v. ~15-min ISR).
 */
export const WEBHOOK_TOPICS: WebhookTopic[] = [
  { header: "products/create", gql: "PRODUCTS_CREATE" },
  { header: "products/update", gql: "PRODUCTS_UPDATE" },
  { header: "products/delete", gql: "PRODUCTS_DELETE" },
  { header: "collections/update", gql: "COLLECTIONS_UPDATE" },
  { header: "inventory_levels/update", gql: "INVENTORY_LEVELS_UPDATE" },
];

/**
 * Welke storefront cache-tags een webhook-topic ongeldig maakt. Spiegelt de
 * tags die lib/products.ts en lib/shopify.ts op hun fetches zetten
 * ("products", "collections", "product:{handle}").
 */
export function tagsForTopic(
  header: string,
  payload: { handle?: string | null } | null,
): string[] {
  if (header.startsWith("products/")) {
    const tags = ["products", "collections"];
    if (payload?.handle) tags.push(`product:${payload.handle}`);
    return tags;
  }
  if (header.startsWith("collections/")) return ["collections"];
  if (header.startsWith("inventory_levels/")) return ["products"];
  // orders/* e.d. → geen storefront-cache (admin leest live).
  return [];
}

/**
 * Verifieert de Shopify-webhook-handtekening (HMAC-SHA256, base64) tegen
 * SHOPIFY_WEBHOOK_SECRET. `rawBody` MOET de exacte, ongewijzigde request-body
 * zijn (vandaar req.text(), niet req.json()).
 */
export function verifyShopifyHmac(
  rawBody: string,
  hmacHeader: string | null,
): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret || !hmacHeader) return false;

  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");

  const a = Buffer.from(digest);
  const b = Buffer.from(hmacHeader);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
