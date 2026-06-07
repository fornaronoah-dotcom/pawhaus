"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import {
  createGiveaway,
  drawWinner,
  setGiveawayStatus,
} from "@/lib/admin/giveaways";
import { logActivity } from "@/lib/admin/activity";

export type GiveawayFormState = { ok?: boolean; error?: string; id?: string };

export async function createGiveawayAction(
  _prev: GiveawayFormState,
  formData: FormData,
): Promise<GiveawayFormState> {
  const user = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const prize = String(formData.get("prize") ?? "").trim() || null;
  if (!title) return { error: "Geef de giveaway een titel." };

  const g = await createGiveaway({ title, description, prize, userId: user.id });
  await logActivity({
    actor: user.id,
    action: "giveaway.create",
    targetType: "giveaway",
    targetId: g.id,
    message: `Giveaway aangemaakt: ${title}`,
  });
  revalidatePath("/admin/giveaways");
  return { ok: true, id: g.id };
}

export async function setGiveawayStatusAction(
  id: string,
  status: "draft" | "open" | "closed",
): Promise<{ ok: boolean }> {
  const user = await requireAdmin();
  await setGiveawayStatus(id, status);
  await logActivity({
    actor: user.id,
    action: "giveaway.status",
    targetType: "giveaway",
    targetId: id,
    message: `Giveaway-status → ${status}`,
  });
  revalidatePath(`/admin/giveaways/${id}`);
  revalidatePath("/admin/giveaways");
  return { ok: true };
}

export async function drawWinnerAction(
  id: string,
): Promise<{ ok: boolean; winner?: string; error?: string }> {
  const user = await requireAdmin();
  const res = await drawWinner(id);
  if (!res.ok) return { ok: false, error: res.error };
  await logActivity({
    actor: user.id,
    action: "giveaway.draw",
    targetType: "giveaway",
    targetId: id,
    message: `Winnaar getrokken: ${res.winner.email}`,
  });
  revalidatePath(`/admin/giveaways/${id}`);
  return { ok: true, winner: res.winner.name ? `${res.winner.name} (${res.winner.email})` : res.winner.email };
}
