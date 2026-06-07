"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guard";
import { setFlag } from "@/lib/admin/feature-flags";
import { logActivity } from "@/lib/admin/activity";
import type { FeatureKey } from "@/lib/admin/nav";

/** Zet een module aan/uit. Enkel de owner mag dit. */
export async function toggleModuleAction(
  key: FeatureKey,
  enabled: boolean,
): Promise<{ ok: boolean }> {
  const user = await requireRole("owner");
  await setFlag(key, enabled);
  await logActivity({
    actor: user.id,
    action: "settings.feature-flag",
    targetType: "module",
    targetId: key,
    message: `Module '${key}' ${enabled ? "geactiveerd" : "gedeactiveerd"}`,
  });
  // Layout (navigatie) + instellingen verversen.
  revalidatePath("/admin", "layout");
  return { ok: true };
}
