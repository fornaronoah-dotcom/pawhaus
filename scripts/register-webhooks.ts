/**
 * Registreert de Shopify-webhooks bij de winkel zodat product-/collectie-/
 * voorraadwijzigingen de storefront direct verversen (zie
 * app/api/webhooks/shopify/route.ts).
 *
 * Draaien:  npm run register-webhooks
 * Vereist in .env.local: SHOPIFY_ADMIN_ACCESS_TOKEN, SHOPIFY_SHOP_DOMAIN
 * (of SHOPIFY_STORE_DOMAIN), NEXT_PUBLIC_SITE_URL, SHOPIFY_WEBHOOK_SECRET.
 *
 * Idempotent: bestaande subscriptions met dezelfde callback-URL worden
 * overgeslagen. Zelfstandige fetch (geen server-only imports) net als
 * scripts/create-admin.ts.
 */
import { WEBHOOK_TOPICS } from "../lib/shopify-webhooks";

const domain = (
  process.env.SHOPIFY_SHOP_DOMAIN ?? process.env.SHOPIFY_STORE_DOMAIN
)?.replace(/^https?:\/\//, "");
const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const apiVersion = process.env.SHOPIFY_ADMIN_API_VERSION ?? "2025-01";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

if (!domain || !token) {
  console.error(
    "✗ Ontbrekend: SHOPIFY_ADMIN_ACCESS_TOKEN en/of SHOPIFY_SHOP_DOMAIN.",
  );
  process.exit(1);
}
if (!siteUrl) {
  console.error("✗ Ontbrekend: NEXT_PUBLIC_SITE_URL (publieke URL van de site).");
  process.exit(1);
}
if (!process.env.SHOPIFY_WEBHOOK_SECRET) {
  console.warn(
    "⚠ SHOPIFY_WEBHOOK_SECRET is niet gezet — de endpoint zal alle webhooks " +
      "met 401 weigeren tot je die invult (= app client secret).",
  );
}

const endpoint = `https://${domain}/admin/api/${apiVersion}/graphql.json`;
const callbackUrl = `${siteUrl}/api/webhooks/shopify`;

async function adminFetch<T>(query: string, variables?: unknown): Promise<T> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token as string,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as {
    data?: T;
    errors?: { message: string }[];
  };
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  if (!json.data) throw new Error("Lege respons van Shopify Admin.");
  return json.data;
}

const EXISTING_QUERY = `
  query {
    webhookSubscriptions(first: 100) {
      edges {
        node {
          id
          topic
          endpoint { __typename ... on WebhookHttpEndpoint { callbackUrl } }
        }
      }
    }
  }
`;

const CREATE_MUTATION = `
  mutation Register($topic: WebhookSubscriptionTopic!, $sub: WebhookSubscriptionInput!) {
    webhookSubscriptionCreate(topic: $topic, webhookSubscription: $sub) {
      userErrors { field message }
      webhookSubscription { id }
    }
  }
`;

type ExistingResp = {
  webhookSubscriptions: {
    edges: {
      node: {
        topic: string;
        endpoint: { __typename: string; callbackUrl?: string };
      };
    }[];
  };
};

async function main() {
  console.log(`→ Callback-URL: ${callbackUrl}`);

  const existing = await adminFetch<ExistingResp>(EXISTING_QUERY);
  const already = new Set(
    existing.webhookSubscriptions.edges
      .filter((e) => e.node.endpoint.callbackUrl === callbackUrl)
      .map((e) => e.node.topic),
  );

  for (const { gql } of WEBHOOK_TOPICS) {
    if (already.has(gql)) {
      console.log(`= ${gql} bestaat al — overgeslagen`);
      continue;
    }
    const data = await adminFetch<{
      webhookSubscriptionCreate: {
        userErrors: { field: string[]; message: string }[];
        webhookSubscription: { id: string } | null;
      };
    }>(CREATE_MUTATION, {
      topic: gql,
      sub: { callbackUrl, format: "JSON" },
    });
    const errs = data.webhookSubscriptionCreate.userErrors;
    if (errs.length) {
      console.error(`✗ ${gql}: ${errs.map((e) => e.message).join("; ")}`);
    } else {
      console.log(`✓ ${gql} geregistreerd`);
    }
  }

  console.log("Klaar.");
  process.exit(0);
}

main().catch((err) => {
  console.error("✗ Registratie mislukt:", err instanceof Error ? err.message : err);
  process.exit(1);
});
