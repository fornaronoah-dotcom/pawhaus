"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import {
  addProductTags,
  removeProductTags,
  setProductShopifyStatus,
  numericIdFromGid,
  type ProductStatus,
} from "@/lib/admin-products";
import { setStatusMany } from "@/lib/admin/product-status";
import { logActivity } from "@/lib/admin/activity";
import { SEO_IMPROVE_TAG, AI_REVIEW_TAG } from "@/lib/admin/bulk-constants";
import type { OptStatus } from "@/lib/db/schema";

export type BulkResult = {
  ok: boolean;
  processed: number;
  succeeded: number;
  failed: number;
  errors: string[];
};

function revalidateStorefront() {
  // "products"-tag zit ook op de detail-fetch, dus dit dekt lijst én detail.
  updateTag("products");
  updateTag("collections");
}

async function runPerProduct(
  gids: string[],
  fn: (gid: string) => Promise<{ ok: boolean; error?: string }>,
): Promise<BulkResult> {
  let succeeded = 0;
  const errors: string[] = [];
  for (const gid of gids) {
    try {
      const r = await fn(gid);
      if (r.ok) succeeded++;
      else errors.push(`${numericIdFromGid(gid)}: ${r.error ?? "fout"}`);
    } catch (err) {
      errors.push(
        `${numericIdFromGid(gid)}: ${err instanceof Error ? err.message : "fout"}`,
      );
    }
  }
  return {
    ok: errors.length === 0,
    processed: gids.length,
    succeeded,
    failed: errors.length,
    errors: errors.slice(0, 10),
  };
}

/* ------------------------------ Shopify-tags --------------------------- */

export async function bulkAddTags(
  gids: string[],
  tags: string[],
): Promise<BulkResult> {
  const user = await requireAdmin();
  const res = await runPerProduct(gids, (gid) => addProductTags(gid, tags));
  revalidateStorefront();
  await logActivity({
    actor: user.id,
    action: "bulk.tags.add",
    targetType: "bulk",
    severity: res.failed ? "warn" : "info",
    message: `Tags toegevoegd (${tags.join(", ")}) aan ${res.succeeded}/${res.processed}`,
  });
  return res;
}

export async function bulkRemoveTags(
  gids: string[],
  tags: string[],
): Promise<BulkResult> {
  const user = await requireAdmin();
  const res = await runPerProduct(gids, (gid) => removeProductTags(gid, tags));
  revalidateStorefront();
  await logActivity({
    actor: user.id,
    action: "bulk.tags.remove",
    targetType: "bulk",
    severity: res.failed ? "warn" : "info",
    message: `Tags verwijderd (${tags.join(", ")}) bij ${res.succeeded}/${res.processed}`,
  });
  return res;
}

/* ----------------------------- Shopify-status -------------------------- */

export async function bulkSetShopifyStatus(
  gids: string[],
  status: ProductStatus,
): Promise<BulkResult> {
  const user = await requireAdmin();
  const res = await runPerProduct(gids, (gid) =>
    setProductShopifyStatus(numericIdFromGid(gid), status),
  );
  revalidateStorefront();
  await logActivity({
    actor: user.id,
    action: "bulk.status",
    targetType: "bulk",
    severity: res.failed ? "warn" : "info",
    message: `Status → ${status} bij ${res.succeeded}/${res.processed}`,
  });
  return res;
}

/* ---------------------- Gecombineerde markeringen ---------------------- */

/** Markeer SEO als te verbeteren (Shopify-tag). */
export async function bulkMarkSeoToImprove(gids: string[]): Promise<BulkResult> {
  return bulkAddTags(gids, [SEO_IMPROVE_TAG]);
}

/** Markeer als klaar voor AI: Shopify-tag + Postgres-status. */
export async function bulkAddAiReview(gids: string[]): Promise<BulkResult> {
  const user = await requireAdmin();
  const res = await runPerProduct(gids, (gid) =>
    addProductTags(gid, [AI_REVIEW_TAG]),
  );
  await setStatusMany(gids, "klaar_voor_ai", user.id);
  revalidateStorefront();
  await logActivity({
    actor: user.id,
    action: "bulk.ai-review",
    targetType: "bulk",
    severity: res.failed ? "warn" : "info",
    message: `AI-review tag + status 'klaar_voor_ai' bij ${res.succeeded}/${res.processed}`,
  });
  return res;
}

/* ------------------------- Optimalisatie-status ------------------------ */

export async function bulkSetOptStatus(
  gids: string[],
  status: OptStatus,
): Promise<BulkResult> {
  const user = await requireAdmin();
  await setStatusMany(gids, status, user.id);
  await logActivity({
    actor: user.id,
    action: "bulk.opt-status",
    targetType: "bulk",
    severity: "info",
    message: `Optimalisatie-status → ${status} bij ${gids.length} producten`,
  });
  return {
    ok: true,
    processed: gids.length,
    succeeded: gids.length,
    failed: 0,
    errors: [],
  };
}
