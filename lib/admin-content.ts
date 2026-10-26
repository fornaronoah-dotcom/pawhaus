import "server-only";

import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { contentBanners, type ContentBanner } from "@/lib/db/schema";

/** Alle banners (admin-overzicht), nieuwste/hoogste sorteervolgorde eerst. */
export function listBanners(): Promise<ContentBanner[]> {
  return db
    .select()
    .from(contentBanners)
    .orderBy(desc(contentBanners.active), asc(contentBanners.sortOrder), desc(contentBanners.createdAt));
}

/**
 * De actieve banner voor de storefront (hoogste prioriteit = laagste
 * sortOrder). Directe DB-read: de storefront-layout is sowieso dynamisch
 * (leest de cart-cookie), dus de banner is altijd actueel. null = geen banner.
 */
export async function getActiveBanner(): Promise<ContentBanner | null> {
  const rows = await db
    .select()
    .from(contentBanners)
    .where(eq(contentBanners.active, true))
    .orderBy(asc(contentBanners.sortOrder), desc(contentBanners.createdAt))
    .limit(1);
  return rows[0] ?? null;
}
