"use server";

import { updateTag, revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { contentBanners } from "@/lib/db/schema";
import { requireAccess } from "@/lib/auth/guard";
import { logActivity } from "@/lib/admin/activity";

export type ContentActionResult = { ok: boolean; error?: string };

/** Maakt een nieuwe banner aan. */
export async function createBannerAction(
  _prev: ContentActionResult,
  formData: FormData,
): Promise<ContentActionResult> {
  const user = await requireAccess("/admin/content");

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim() || null;
  const linkUrl = String(formData.get("linkUrl") ?? "").trim() || null;
  const active = formData.get("active") === "on";
  const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;

  if (!title) return { ok: false, error: "Titel is verplicht." };

  await db.insert(contentBanners).values({ title, body, linkUrl, active, sortOrder });
  await logActivity({
    actor: user.id,
    action: "content.banner.create",
    targetType: "content_banner",
    message: `Banner "${title}" aangemaakt`,
  });
  updateTag("content");
  revalidatePath("/admin/content");
  return { ok: true };
}

/** Zet een banner actief/inactief. */
export async function toggleBannerAction(
  id: string,
  active: boolean,
): Promise<ContentActionResult> {
  const user = await requireAccess("/admin/content");
  await db
    .update(contentBanners)
    .set({ active, updatedAt: new Date() })
    .where(eq(contentBanners.id, id));
  await logActivity({
    actor: user.id,
    action: "content.banner.toggle",
    targetType: "content_banner",
    targetId: id,
    message: active ? "Banner geactiveerd" : "Banner gedeactiveerd",
  });
  updateTag("content");
  revalidatePath("/admin/content");
  return { ok: true };
}

/** Verwijdert een banner. */
export async function deleteBannerAction(
  id: string,
): Promise<ContentActionResult> {
  const user = await requireAccess("/admin/content");
  await db.delete(contentBanners).where(eq(contentBanners.id, id));
  await logActivity({
    actor: user.id,
    action: "content.banner.delete",
    targetType: "content_banner",
    targetId: id,
    message: "Banner verwijderd",
  });
  updateTag("content");
  revalidatePath("/admin/content");
  return { ok: true };
}
