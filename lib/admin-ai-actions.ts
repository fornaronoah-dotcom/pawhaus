"use server";

import { updateTag, revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import {
  getAdminProduct,
  updateAdminProduct,
  type ProductUpdateFields,
} from "@/lib/admin-products";
import { isAiConfigured, GEMINI_MODEL } from "@/lib/ai/gemini";
import {
  generateProductTextProposal,
  type ProductTextProposal,
} from "@/lib/ai/optimize-text";
import {
  createProposal,
  getProposal,
  markProposalApplied,
  markProposalRejected,
} from "@/lib/ai/proposals";
import { logActivity } from "@/lib/admin/activity";

export type GenerateResult =
  | { ok: true; proposalId: string; fields: ProductTextProposal }
  | { ok: false; error: string };

/** Genereert een AI-tekstvoorstel (Gemini) en bewaart het als concept. */
export async function generateProposalAction(
  numericId: string,
): Promise<GenerateResult> {
  const user = await requireAdmin();

  if (!isAiConfigured) {
    return { ok: false, error: "GEMINI_API_KEY ontbreekt in .env.local." };
  }

  const product = await getAdminProduct(numericId);
  if (!product) return { ok: false, error: "Product niet gevonden." };

  let fields: ProductTextProposal;
  try {
    fields = await generateProductTextProposal(product);
  } catch (err) {
    const error = err instanceof Error ? err.message : "AI-generatie mislukt.";
    await logActivity({
      actor: user.id,
      action: "ai.generate",
      targetType: "product",
      targetId: numericId,
      severity: "error",
      message: error,
    });
    return { ok: false, error };
  }

  const proposal = await createProposal({
    shopifyProductGid: product.id,
    numericId,
    fields,
    model: GEMINI_MODEL,
    userId: user.id,
  });

  await logActivity({
    actor: user.id,
    action: "ai.generate",
    targetType: "product",
    targetId: numericId,
    message: `AI-concept gemaakt (${GEMINI_MODEL})`,
    meta: { proposalId: proposal.id },
  });

  return { ok: true, proposalId: proposal.id, fields };
}

/**
 * Past geselecteerde velden van een goedgekeurd concept toe op Shopify.
 * Dit is de handmatige goedkeuringsstap — AI publiceert nooit zelf.
 */
export async function applyProposalAction(
  proposalId: string,
  selected: string[],
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireAdmin();

  const proposal = await getProposal(proposalId);
  if (!proposal) return { ok: false, error: "Concept niet gevonden." };
  if (selected.length === 0)
    return { ok: false, error: "Geen velden geselecteerd." };

  const f = proposal.fields as ProductTextProposal;
  const numericId = proposal.numericId;

  // Huidige Shopify-waarden ophalen om SEO niet per ongeluk te wissen.
  const current = await getAdminProduct(numericId);

  const upd: ProductUpdateFields = {};
  if (selected.includes("title")) upd.title = f.title;
  if (selected.includes("descriptionHtml")) upd.descriptionHtml = f.descriptionHtml;
  if (selected.includes("tags")) upd.tags = f.tags;
  if (selected.includes("seoTitle") || selected.includes("metaDescription")) {
    upd.seoTitle = selected.includes("seoTitle")
      ? f.seoTitle
      : (current?.seoTitle ?? "");
    upd.seoDescription = selected.includes("metaDescription")
      ? f.metaDescription
      : (current?.seoDescription ?? "");
  }

  let result;
  try {
    result = await updateAdminProduct(numericId, upd);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Fout." };
  }
  if (!result.ok) return { ok: false, error: result.error };

  await markProposalApplied(proposalId, selected);

  updateTag("products");
  updateTag(`product:${result.handle}`);
  updateTag("collections");
  revalidatePath(`/admin/products/${numericId}`);

  await logActivity({
    actor: user.id,
    action: "ai.apply",
    targetType: "product",
    targetId: numericId,
    message: `AI-concept toegepast: ${selected.join(", ")}`,
    meta: { proposalId },
  });

  return { ok: true };
}

export async function rejectProposalAction(
  proposalId: string,
): Promise<{ ok: boolean }> {
  const user = await requireAdmin();
  await markProposalRejected(proposalId);
  await logActivity({
    actor: user.id,
    action: "ai.reject",
    targetType: "proposal",
    targetId: proposalId,
    message: "AI-concept verworpen",
  });
  return { ok: true };
}
