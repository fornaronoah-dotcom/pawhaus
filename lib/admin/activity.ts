import "server-only";

import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { activityLog, type ActivityLog } from "@/lib/db/schema";

/**
 * Schrijft een regel naar het audit-log. Faalt nooit hard: logging mag een
 * gelukte beheeractie niet doen omvallen.
 */
export async function logActivity(entry: {
  actor: string;
  action: string;
  targetType?: string;
  targetId?: string;
  severity?: "info" | "warn" | "error";
  message?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.insert(activityLog).values({
      actor: entry.actor,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      severity: entry.severity ?? "info",
      message: entry.message,
      meta: entry.meta,
    });
  } catch (err) {
    console.error("[activity] kon log niet schrijven:", err);
  }
}

export function recentActivity(limit = 50): Promise<ActivityLog[]> {
  return db
    .select()
    .from(activityLog)
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);
}

/** Activiteit voor één product (target_id = numeriek product-id). */
export function activityForTarget(
  targetId: string,
  limit = 20,
): Promise<ActivityLog[]> {
  return db
    .select()
    .from(activityLog)
    .where(eq(activityLog.targetId, targetId))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);
}
