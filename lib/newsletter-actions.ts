"use server";

import { subscribeEmail } from "@/lib/newsletter";
import { logActivity } from "@/lib/admin/activity";

/**
 * Publieke nieuwsbrief-inschrijving (geen admin-auth — wordt ook vanaf de
 * storefront aangeroepen). Schrijft de klant met toestemming naar Shopify.
 */
export type NewsletterState = { ok?: boolean; error?: string; message?: string };

export async function subscribeNewsletterAction(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const email = String(formData.get("email") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim() || undefined;

  const result = await subscribeEmail(email, firstName);

  if (!result.ok) return { error: result.error };

  await logActivity({
    actor: "newsletter",
    action: "newsletter.subscribe",
    targetType: "customer",
    message: result.already
      ? `Al ingeschreven: ${email}`
      : result.created
        ? `Nieuwe inschrijving: ${email}`
        : `Toestemming bijgewerkt: ${email}`,
  });

  return {
    ok: true,
    message: result.already
      ? "Je bent al ingeschreven — bedankt!"
      : "Bedankt voor je inschrijving!",
  };
}
