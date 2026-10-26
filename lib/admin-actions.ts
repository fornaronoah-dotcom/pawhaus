"use server";

import { updateTag, revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import {
  updateAdminProduct,
  setMainImage,
  removeProductTags,
  productGid,
} from "@/lib/admin-products";
import { setStatusMany } from "@/lib/admin/product-status";
import { logActivity } from "@/lib/admin/activity";
import type { OptStatus } from "@/lib/db/schema";

export type ProductUpdateState = {
  ok?: boolean;
  error?: string;
  savedAt?: number;
};

/**
 * Schrijft basis-productvelden terug naar Shopify en ververst daarna de
 * storefront-cache. Shopify blijft de bron; hier wordt niets lokaal bewaard.
 */
export async function updateProductAction(
  _prev: ProductUpdateState,
  formData: FormData,
): Promise<ProductUpdateState> {
  const user = await requireAdmin();

  const numericId = String(formData.get("numericId") ?? "");
  if (!numericId) return { error: "Ontbrekend product-id." };

  const tagsRaw = String(formData.get("tags") ?? "");
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const fields = {
    title: String(formData.get("title") ?? "").trim(),
    descriptionHtml: String(formData.get("descriptionHtml") ?? ""),
    tags,
    seoTitle: String(formData.get("seoTitle") ?? "").trim(),
    seoDescription: String(formData.get("seoDescription") ?? "").trim(),
  };

  if (!fields.title) return { error: "Titel mag niet leeg zijn." };

  let result: Awaited<ReturnType<typeof updateAdminProduct>>;
  try {
    result = await updateAdminProduct(numericId, fields);
  } catch (err) {
    const error = err instanceof Error ? err.message : "Onbekende fout.";
    await logActivity({
      actor: user.id,
      action: "product.update",
      targetType: "product",
      targetId: numericId,
      severity: "error",
      message: error,
    });
    return { error };
  }

  if (!result.ok) {
    await logActivity({
      actor: user.id,
      action: "product.update",
      targetType: "product",
      targetId: numericId,
      severity: "error",
      message: result.error,
    });
    return { error: result.error };
  }

  // Storefront-cache verversen (Server Action → updateTag, read-your-writes).
  updateTag("products");
  updateTag(`product:${result.handle}`);
  updateTag("collections");
  // Admin-detail opnieuw renderen met de verse Shopify-waarden.
  revalidatePath(`/admin/products/${numericId}`);

  await logActivity({
    actor: user.id,
    action: "product.update",
    targetType: "product",
    targetId: numericId,
    severity: "info",
    message: `Bijgewerkt: ${fields.title}`,
    meta: { handle: result.handle, fields: Object.keys(fields) },
  });

  return { ok: true, savedAt: Date.now() };
}

/** Maakt een gekozen media-item de hoofdafbeelding (productReorderMedia). */
export async function setMainImageAction(
  numericId: string,
  mediaId: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireAdmin();
  try {
    const r = await setMainImage(numericId, mediaId);
    if (!r.ok) {
      await logActivity({
        actor: user.id,
        action: "product.main-image",
        targetType: "product",
        targetId: numericId,
        severity: "error",
        message: r.error,
      });
      return r;
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Fout." };
  }
  updateTag("products");
  revalidatePath(`/admin/products/${numericId}`);
  await logActivity({
    actor: user.id,
    action: "product.main-image",
    targetType: "product",
    targetId: numericId,
    message: "Hoofdafbeelding gewijzigd",
  });
  return { ok: true };
}

/** Zet de optimalisatie-status (Postgres) voor één product. */
export async function setOptStatusAction(
  numericId: string,
  status: OptStatus,
): Promise<{ ok: boolean }> {
  const user = await requireAdmin();
  await setStatusMany([productGid(numericId)], status, user.id);
  revalidatePath(`/admin/products/${numericId}`);
  await logActivity({
    actor: user.id,
    action: "product.opt-status",
    targetType: "product",
    targetId: numericId,
    message: `Optimalisatie-status → ${status}`,
  });
  return { ok: true };
}

/**
 * Markeert een nieuw product als afgewerkt: verwijdert de `nieuw-product`-tag
 * (waardoor het van de "Nieuwe producten"-werklijst verdwijnt).
 */
export async function markNewProductDoneAction(
  gid: string,
  numericId: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireAdmin();
  const res = await removeProductTags(gid, ["nieuw-product"]);
  if (!res.ok) return { ok: false, error: res.error };
  updateTag("products");
  revalidatePath("/admin/nieuwe-producten");
  await logActivity({
    actor: user.id,
    action: "product.new.done",
    targetType: "product",
    targetId: numericId,
    message: "Nieuw product gemarkeerd als afgewerkt (tag nieuw-product verwijderd)",
  });
  return { ok: true };
}
