"use server";

import { updateTag, revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import {
  createDraft,
  getDraft,
  markDraftPublished,
  deleteDraft,
  markFlowSent,
  unmarkFlowSent,
} from "@/lib/admin/media-review";
import { uploadImageToShopify } from "@/lib/shopify-media";
import { setMainImage } from "@/lib/admin-products";
import { logActivity } from "@/lib/admin/activity";
import {
  improveImage,
  isImageAiConfigured,
  type ImageOp,
} from "@/lib/ai/images/providers";

type Result = { ok: boolean; error?: string };

/**
 * Verbetert een originele foto automatisch via fal.ai (achtergrond weg /
 * upscale) en slaat het resultaat op als draft. De bestaande preview +
 * publiceer-flow (oud vs nieuw → goedkeuren) handelt de rest af. Publiceert
 * dus NOOIT vanzelf.
 */
export async function autoImproveImageAction(input: {
  numericId: string;
  shopifyProductGid: string;
  originalMediaId: string;
  originalUrl: string;
  op: ImageOp;
}): Promise<Result & { draftId?: string }> {
  const user = await requireAdmin();
  if (!isImageAiConfigured) {
    return { ok: false, error: "fal.ai is niet geconfigureerd (FAL_KEY ontbreekt)." };
  }

  try {
    const { bytes, contentType } = await improveImage(input.originalUrl, input.op);
    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : "jpg";

    const draftId = await createDraft({
      shopifyProductGid: input.shopifyProductGid,
      numericId: input.numericId,
      originalMediaId: input.originalMediaId,
      originalUrl: input.originalUrl,
      filename: `ai-${input.op}-${input.numericId}.${ext}`,
      mime: contentType,
      dataBase64: bytes.toString("base64"),
      createdBy: user.id,
    });

    revalidatePath(`/admin/products/${input.numericId}`);
    await logActivity({
      actor: user.id,
      action: `image.ai.${input.op}`,
      targetType: "product",
      targetId: input.numericId,
      message: `AI-foto (${input.op}) als draft aangemaakt`,
    });
    return { ok: true, draftId };
  } catch (err) {
    await logActivity({
      actor: user.id,
      action: `image.ai.${input.op}`,
      targetType: "product",
      targetId: input.numericId,
      severity: "error",
      message: err instanceof Error ? err.message : "AI-verbetering mislukt",
    });
    return {
      ok: false,
      error: err instanceof Error ? err.message : "AI-verbetering mislukt.",
    };
  }
}

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
