import "server-only";

import { eq, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  giveaways,
  giveawayEntries,
  type Giveaway,
  type GiveawayEntry,
} from "@/lib/db/schema";

/** Giveaways — eigen Postgres-data (geen Shopify-bron). */

export type GiveawayWithCount = Giveaway & { entryCount: number };

export async function createGiveaway(input: {
  title: string;
  description?: string | null;
  prize?: string | null;
  userId: string | null;
}): Promise<Giveaway> {
  const [row] = await db
    .insert(giveaways)
    .values({
      title: input.title,
      description: input.description ?? null,
      prize: input.prize ?? null,
      createdBy: input.userId,
    })
    .returning();
  return row;
}

export async function listGiveaways(): Promise<GiveawayWithCount[]> {
  const rows = await db
    .select({
      g: giveaways,
      entryCount: sql<number>`count(${giveawayEntries.id})::int`,
    })
    .from(giveaways)
    .leftJoin(giveawayEntries, eq(giveawayEntries.giveawayId, giveaways.id))
    .groupBy(giveaways.id)
    .orderBy(desc(giveaways.createdAt));
  return rows.map((r) => ({ ...r.g, entryCount: r.entryCount }));
}

export async function getGiveaway(id: string): Promise<Giveaway | null> {
  const [row] = await db.select().from(giveaways).where(eq(giveaways.id, id)).limit(1);
  return row ?? null;
}

export async function listEntries(giveawayId: string): Promise<GiveawayEntry[]> {
  return db
    .select()
    .from(giveawayEntries)
    .where(eq(giveawayEntries.giveawayId, giveawayId))
    .orderBy(desc(giveawayEntries.createdAt));
}

/** Voegt een deelnemer toe. Dubbele e-mails per giveaway worden genegeerd. */
export async function addEntry(
  giveawayId: string,
  email: string,
  name?: string | null,
): Promise<{ added: boolean }> {
  const res = await db
    .insert(giveawayEntries)
    .values({ giveawayId, email: email.trim().toLowerCase(), name: name ?? null })
    .onConflictDoNothing()
    .returning({ id: giveawayEntries.id });
  return { added: res.length > 0 };
}

export async function setGiveawayStatus(
  id: string,
  status: "draft" | "open" | "closed",
): Promise<void> {
  await db.update(giveaways).set({ status }).where(eq(giveaways.id, id));
}

/** Trekt willekeurig een winnaar uit de deelnemers en sluit de giveaway. */
export async function drawWinner(
  id: string,
): Promise<{ ok: true; winner: GiveawayEntry } | { ok: false; error: string }> {
  const entries = await listEntries(id);
  if (entries.length === 0) return { ok: false, error: "Geen deelnemers om uit te trekken." };
  const winner = entries[Math.floor(Math.random() * entries.length)];
  await db
    .update(giveaways)
    .set({ winnerEntryId: winner.id, status: "closed" })
    .where(eq(giveaways.id, id));
  return { ok: true, winner };
}
