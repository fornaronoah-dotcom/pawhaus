import "server-only";

import { db } from "@/lib/db/client";
import { featureFlags } from "@/lib/db/schema";
import type { FeatureKey } from "@/lib/admin/nav";

/**
 * Feature flags voor het geleidelijk activeren van modules. Standaard staat
 * alles uit (placeholder); de owner zet ze aan in Instellingen.
 */
export const DEFAULT_FLAGS: Record<FeatureKey, boolean> = {
  bundels: true, // gebouwd (Fase 3) — actief
  kortingen: true, // gebouwd (Fase 3) — actief
  klanten: true, // gebouwd (Fase 4) — actief
  marketing: true, // gebouwd (Fase 4) — actief
  giveaways: true, // gebouwd (Fase 5) — actief
  content: true, // gebouwd (announcement-banners) — actief
  analytics: true, // gebouwd (Fase 6) — actief
};

/** Volledige flag-map (DB-waarden over de standaarden heen). */
export async function getFlagMap(): Promise<Record<FeatureKey, boolean>> {
  const rows = await db
    .select({ key: featureFlags.key, enabled: featureFlags.enabled })
    .from(featureFlags);
  const map = { ...DEFAULT_FLAGS };
  for (const r of rows) {
    if (r.key in map) map[r.key as FeatureKey] = r.enabled;
  }
  return map;
}

export async function setFlag(key: FeatureKey, enabled: boolean): Promise<void> {
  await db
    .insert(featureFlags)
    .values({ key, enabled, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: featureFlags.key,
      set: { enabled, updatedAt: new Date() },
    });
}
