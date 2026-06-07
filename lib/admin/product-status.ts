import "server-only";

import { inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { productStatus, type OptStatus } from "@/lib/db/schema";

/**
 * Beheer van de optimalisatie-/AI-workflowstatus per product (Postgres,
 * beheermetadata). Geen rij = "niet_gecontroleerd". Labels/default staan in
 * lib/admin/opt-status.ts (client-veilig).
 */

/** Haalt de status van meerdere producten op (gid → status). */
export async function getStatusMap(
  gids: string[],
): Promise<Map<string, OptStatus>> {
  const map = new Map<string, OptStatus>();
  if (gids.length === 0) return map;
  const rows = await db
    .select({
      gid: productStatus.shopifyProductGid,
      status: productStatus.status,
    })
    .from(productStatus)
    .where(inArray(productStatus.shopifyProductGid, gids));
  for (const r of rows) map.set(r.gid, r.status);
  return map;
}

/** Zet (upsert) de status voor meerdere producten. */
export async function setStatusMany(
  gids: string[],
  status: OptStatus,
  userId: string | null,
): Promise<void> {
  if (gids.length === 0) return;
  await db
    .insert(productStatus)
    .values(
      gids.map((gid) => ({
        shopifyProductGid: gid,
        status,
        updatedBy: userId,
        updatedAt: new Date(),
      })),
    )
    .onConflictDoUpdate({
      target: productStatus.shopifyProductGid,
      set: { status, updatedBy: userId, updatedAt: new Date() },
    });
}
