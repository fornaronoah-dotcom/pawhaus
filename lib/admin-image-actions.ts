"use server";

import { updateTag, revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import {
  getDraft,
  markDraftPublished,
  deleteDraft,
  markFlowSent,
  unmarkFlowSent,
} from "@/lib/admin/media-review";
import { uploadImageToShopify } from "@/lib/shopify-media";
import { setMainImage } from "@/lib/admin-products";
import { logActivity } from "@/lib/admin/activity";

type Result = { ok: boolean; error?: string };

/** Markeer een originele foto als "naar Google Flow gestuurd". */
export async function markSentToFlowAction(
  shopifyProductGid: string,
  mediaId: string,
  numericId: string,
): Promise<Result> {
  const user = await requireAdmin();
  await markFlowSent(mediaId, shopifyProductGid, user.id);
  revalidatePath(`/admin/products/${numericId}`);
  return { ok: true };
}

export async function unmarkSentToFlowAction(
  mediaId: string,
  numericId: string,
): Promise<Result> {
  await requireAdmin();
  await unmarkFlowSent(mediaId);
  revalidatePath(`/admin/products/${numericId}`);
  return { ok: true };
}

/**
 * Publiceert een draft naar Shopify als extra afbeelding, of als
 * hoofdafbeelding. Gebeurt ENKEL bij expliciete goedkeuring.
 */
export async function publishDraftAction(
  draftId: string,
  asMain: boolean,
): Promise<Result> {
  const user = await requireAdmin();

  const draft = await getDraft(draftId);
  if (!draft) return { ok: false, error: "Draft niet gevonden." };
  if (draft.shopifyMediaId) return { ok: false, error: "Draft is al gepubliceerd." };

  let result: Awaited<ReturnType<typeof uploadImageToShopify>>;
  try {
    const bytes = Buffer.from(draft.dataBase64, "base64");
    result = await uploadImageToShopify(
      draft.numericId,
      bytes,
      draft.filename,
      draft.mime,
      "",
    );
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Uploadfout." };
  }
  if (!result.ok) {
    await logActivity({
      actor: user.id,
      action: "image.publish",
      targetType: "product",
      targetId: draft.numericId,
      severity: "error",
      message: result.error,
    });
    return { ok: false, error: result.error };
  }

  if (asMain) {
    const main = await setMainImage(draft.numericId, result.mediaId);
    if (!main.ok) {
      // Foto staat wel op Shopify, maar kon niet als hoofd gezet worden.
      await markDraftPublished(draftId, "published_extra", result.mediaId);
      updateTag("products");
      revalidatePath(`/admin/products/${draft.numericId}`);
      return {
        ok: false,
        error: `Geüpload als extra foto, maar als hoofd instellen mislukte: ${main.error}`,
      };
    }
  }

  await markDraftPublished(
    draftId,
    asMain ? "published_main" : "published_extra",
    result.mediaId,
  );
  updateTag("products");
  revalidatePath(`/admin/products/${draft.numericId}`);
  await logActivity({
    actor: user.id,
    action: asMain ? "image.publish.main" : "image.publish.extra",
    targetType: "product",
    targetId: draft.numericId,
    message: asMain
      ? "Draft gepubliceerd als hoofdafbeelding"
      : "Draft gepubliceerd als extra afbeelding",
  });
  return { ok: true };
}

export async function discardDraftAction(
  draftId: string,
  numericId: string,
): Promise<Result> {
  const user = await requireAdmin();
  await deleteDraft(draftId);
  revalidatePath(`/admin/products/${numericId}`);
  await logActivity({
    actor: user.id,
    action: "image.draft.discard",
    targetType: "product",
    targetId: numericId,
    message: "Beeld-draft verwijderd",
  });
  return { ok: true };
}
