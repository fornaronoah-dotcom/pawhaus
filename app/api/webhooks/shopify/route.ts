import { revalidateTag } from "next/cache";
import {
  verifyShopifyHmac,
  tagsForTopic,
} from "@/lib/shopify-webhooks";
import { logActivity } from "@/lib/admin/activity";

/**
 * Shopify → Next webhook-ontvanger. Verifieert de HMAC-handtekening en
 * ververst de getroffen storefront cache-tags direct, zodat externe
 * Shopify-wijzigingen (product/voorraad/collectie) niet pas na ~15-min ISR
 * zichtbaar worden.
 *
 * Registreren: `npm run register-webhooks` (zie scripts/register-webhooks.ts).
 * Vereist env SHOPIFY_WEBHOOK_SECRET (= app client secret bij API-webhooks).
 */
export const runtime = "nodejs";
// Webhooks mogen nooit uit een cache komen.
export const dynamic = "force-dynamic";

const allowedDomain = (
  process.env.SHOPIFY_SHOP_DOMAIN ?? process.env.SHOPIFY_STORE_DOMAIN
)?.replace(/^https?:\/\//, "");

export async function POST(req: Request): Promise<Response> {
  // HMAC vereist de exacte bytes → eerst de ruwe tekst lezen.
  const rawBody = await req.text();
  const hmac = req.headers.get("x-shopify-hmac-sha256");
  const topic = req.headers.get("x-shopify-topic") ?? "";
  const shop = req.headers.get("x-shopify-shop-domain");

  if (!verifyShopifyHmac(rawBody, hmac)) {
    return Response.json({ error: "ongeldige handtekening" }, { status: 401 });
  }
  if (allowedDomain && shop && shop !== allowedDomain) {
    return Response.json({ error: "onbekende winkel" }, { status: 401 });
  }

  let payload: { handle?: string | null } | null = null;
  try {
    payload = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    payload = null;
  }

  const tags = tagsForTopic(topic, payload);
  for (const tag of tags) {
    // Route Handler-vorm: revalidateTag(tag, profile) — niet updateTag (server actions).
    revalidateTag(tag, "max");
  }

  // Niet-blokkerend loggen; antwoord altijd snel 200 (Shopify re-queue't anders).
  void logActivity({
    actor: "webhook",
    action: "shopify_webhook",
    targetType: "shopify",
    message: `${topic} → ${tags.length ? tags.join(", ") : "geen tags"}`,
    meta: { topic, tags },
  });

  return Response.json({ ok: true, topic, revalidated: tags });
}
