"use server";

import { getGiveaway, addEntry } from "@/lib/admin/giveaways";
import { subscribeEmail } from "@/lib/newsletter";
import { logActivity } from "@/lib/admin/activity";

/**
 * Publieke deelname aan een giveaway (geen admin-auth — vanaf de storefront).
 * Slaat de deelname op in Postgres en schrijft optioneel in op de nieuwsbrief.
 */
export type EntryState = { ok?: boolean; error?: string; message?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function enterGiveawayAction(
  _prev: EntryState,
  formData: FormData,
): Promise<EntryState> {
  const giveawayId = String(formData.get("giveawayId") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim() || null;
  const newsletter = formData.get("newsletter") === "on";

  if (!EMAIL_RE.test(email)) return { error: "Vul een geldig e-mailadres in." };

  const giveaway = await getGiveaway(giveawayId);
  if (!giveaway) return { error: "Deze giveaway bestaat niet." };
  if (giveaway.status !== "open") return { error: "Deze giveaway is niet (meer) open." };

  const { added } = await addEntry(giveawayId, email, name);

  // Optioneel: ook inschrijven op de nieuwsbrief (Shopify-klant met consent).
  if (newsletter) {
    await subscribeEmail(email, name ?? undefined).catch(() => {});
  }

  await logActivity({
    actor: "giveaway",
    action: "giveaway.entry",
    targetType: "giveaway",
    targetId: giveawayId,
    message: added ? `Nieuwe deelname: ${email}` : `Dubbele deelname genegeerd: ${email}`,
  });

  return {
    ok: true,
    message: added ? "Je deelname is geregistreerd. Succes! 🎉" : "Je deed al mee — succes! 🎉",
  };
}
