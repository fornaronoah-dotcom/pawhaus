"use server";

import { updateTag, revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import { createBundle, type BundleItem } from "@/lib/admin-bundles";
import { logActivity } from "@/lib/admin/activity";

export type BundleFormState = {
  ok?: boolean;
  error?: string;
  handle?: string;
  numericId?: string;
};

export async function createBundleAction(
  _prev: BundleFormState,
  formData: FormData,
): Promise<BundleFormState> {
  const user = await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const price = String(formData.get("price") ?? "").trim();
  let items: BundleItem[] = [];
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]")) as BundleItem[];
  } catch {
    return { error: "Ongeldige productselectie." };
  }

  if (!title) return { error: "Geef de bundel een titel." };
  if (items.length < 2) return { error: "Kies minstens 2 producten." };

  const result = await createBundle({
    title,
    items,
    price: price || null,
  });

  if (!result.ok) {
    await logActivity({
      actor: user.id,
      action: "bundle.create",
      targetType: "bundle",
      severity: "error",
      message: result.error,
    });
    return { error: result.error };
  }

  updateTag("products");
  updateTag("collections");
  revalidatePath("/admin/bundels");

  await logActivity({
    actor: user.id,
    action: "bundle.create",
    targetType: "product",
    targetId: result.numericId,
    message: `Bundel aangemaakt: ${title}`,
  });

  return { ok: true, handle: result.handle, numericId: result.numericId };
}
