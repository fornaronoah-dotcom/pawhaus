import "server-only";

import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  mediaReview,
  flowSent,
  type MediaReview,
} from "@/lib/db/schema";

/** Metadata van een draft (zonder de zware base64-data). */
export type DraftMeta = Pick<
  MediaReview,
  | "id"
  | "originalUrl"
  | "originalMediaId"
  | "filename"
  | "mime"
  | "status"
  | "shopifyMediaId"
  | "createdAt"
>;

export async function createDraft(input: {
  shopifyProductGid: string;
  numericId: string;
  originalMediaId: string | null;
  originalUrl: string | null;
  filename: string;
  mime: string;
  dataBase64: string;
  createdBy: string | null;
}): Promise<string> {
  const [row] = await db
    .insert(mediaReview)
    .values(input)
    .returning({ id: mediaReview.id });
  return row.id;
}

/** Drafts van een product (zonder de binaire data), nieuwste eerst. */
export function listDraftsForProduct(numericId: string): Promise<DraftMeta[]> {
  return db
    .select({
      id: mediaReview.id,
      originalUrl: mediaReview.originalUrl,
      originalMediaId: mediaReview.originalMediaId,
      filename: mediaReview.filename,
      mime: mediaReview.mime,
      status: mediaReview.status,
      shopifyMediaId: mediaReview.shopifyMediaId,
      createdAt: mediaReview.createdAt,
    })
    .from(mediaReview)
    .where(
      and(
        eq(mediaReview.numericId, numericId),
        ne(mediaReview.status, "discarded"),
      ),
    )
    .orderBy(desc(mediaReview.createdAt));
}

export async function getDraft(id: string): Promise<MediaReview | null> {
  const rows = await db
    .select()
    .from(mediaReview)
    .where(eq(mediaReview.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function markDraftPublished(
  id: string,
  status: "published_extra" | "published_main",
  shopifyMediaId: string,
): Promise<void> {
  await db
    .update(mediaReview)
    .set({ status, shopifyMediaId })
    .where(eq(mediaReview.id, id));
}

export async function deleteDraft(id: string): Promise<void> {
  await db.delete(mediaReview).where(eq(mediaReview.id, id));
}

/* ----------------------------- flow_sent ------------------------------- */

export async function markFlowSent(
  shopifyMediaId: string,
  shopifyProductGid: string,
  userId: string | null,
): Promise<void> {
  await db
    .insert(flowSent)
    .values({ shopifyMediaId, shopifyProductGid, createdBy: userId })
    .onConflictDoNothing();
}

export async function unmarkFlowSent(shopifyMediaId: string): Promise<void> {
  await db.delete(flowSent).where(eq(flowSent.shopifyMediaId, shopifyMediaId));
}

export async function getFlowSentSet(
  shopifyProductGid: string,
): Promise<Set<string>> {
  const rows = await db
    .select({ id: flowSent.shopifyMediaId })
    .from(flowSent)
    .where(eq(flowSent.shopifyProductGid, shopifyProductGid));
  return new Set(rows.map((r) => r.id));
}
