import "server-only";

import { shopifyAdminFetch } from "@/lib/shopify-admin";
import {
  CUSTOMER_BY_EMAIL_QUERY,
  CUSTOMER_CREATE_MUTATION,
  CUSTOMER_CONSENT_UPDATE_MUTATION,
} from "@/lib/admin-marketing-queries";

/**
 * Schrijft een e-mailadres in op de nieuwsbrief: maakt een Shopify-klant (of
 * werkt een bestaande bij) met e-mailmarketing-toestemming SUBSCRIBED.
 * Shopify blijft de bron; van daaruit verloopt de e-mailmarketing.
 */

export type SubscribeResult =
  | { ok: true; created: boolean; already?: boolean }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type UserError = { field: string[] | null; message: string };

const CONSENT = {
  marketingState: "SUBSCRIBED",
  marketingOptInLevel: "SINGLE_OPT_IN",
};

export async function subscribeEmail(
  emailRaw: string,
  firstName?: string,
): Promise<SubscribeResult> {
  const email = emailRaw.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Ongeldig e-mailadres." };

  // 1. Bestaat de klant al?
  const found = await shopifyAdminFetch<{
    customers: { edges: { node: { id: string; defaultEmailAddress: { marketingState: string } | null } }[] };
  }>({ query: CUSTOMER_BY_EMAIL_QUERY, variables: { query: `email:${email}` } });

  const existing = found.customers.edges[0]?.node;

  if (existing) {
    if (existing.defaultEmailAddress?.marketingState === "SUBSCRIBED") {
      return { ok: true, created: false, already: true };
    }
    const upd = await shopifyAdminFetch<{
      customerEmailMarketingConsentUpdate: { userErrors: UserError[] };
    }>({
      query: CUSTOMER_CONSENT_UPDATE_MUTATION,
      variables: { input: { customerId: existing.id, emailMarketingConsent: CONSENT } },
    });
    const errs = upd.customerEmailMarketingConsentUpdate.userErrors;
    if (errs.length) return { ok: false, error: errs.map((e) => e.message).join("; ") };
    return { ok: true, created: false };
  }

  // 2. Nieuwe klant met toestemming.
  const created = await shopifyAdminFetch<{
    customerCreate: { customer: { id: string } | null; userErrors: UserError[] };
  }>({
    query: CUSTOMER_CREATE_MUTATION,
    variables: {
      input: {
        email,
        ...(firstName ? { firstName } : {}),
        emailMarketingConsent: CONSENT,
        tags: ["nieuwsbrief"],
      },
    },
  });
  const errs = created.customerCreate.userErrors;
  if (errs.length) return { ok: false, error: errs.map((e) => e.message).join("; ") };
  return { ok: true, created: true };
}
