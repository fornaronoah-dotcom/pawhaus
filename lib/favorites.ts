import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { customerFavorites } from "@/lib/db/schema";

/**
 * Favorieten-opslag in Postgres, gekoppeld aan het Shopify customer-id.
 * Shopify slaat geen verlanglijst op, dus dit is de bron van waarheid.
 * Gasten bewaren favorieten in localStorage (client) tot ze inloggen.
 */

/** Alle favoriete product-handles van een klant (nieuwste eerst). */
export async function getFavorites(customerId: string): Promise<string[]> {
  const rows = await db
    .select({ handle: customerFavorites.productHandle })
    .from(customerFavorites)
    .where(eq(customerFavorites.customerId, customerId))
    .orderBy(desc(customerFavorites.createdAt));
  return rows.map((r) => r.handle);
}

/** Toggelt één favoriet. Geeft terug of het product nu favoriet is. */
export async function toggleFavorite(
  customerId: string,
  handle: string,
): Promise<{ favorited: boolean }> {
  const existing = await db
    .select({ id: customerFavorites.id })
    .from(customerFavorites)
    .where(
      and(
        eq(customerFavorites.customerId, customerId),
        eq(customerFavorites.productHandle, handle),
      ),
    )
    .limit(1);

  if (existing[0]) {
    await db
      .delete(customerFavorites)
      .where(eq(customerFavorites.id, existing[0].id));
    return { favorited: false };
  }

  await db
    .insert(customerFavorites)
    .values({ customerId, productHandle: handle })
    .onConflictDoNothing();
  return { favorited: true };
}

/** Voegt een lijst gast-handles toe aan het account (idempotent). */
export async function mergeFavorites(
  customerId: string,
  handles: string[],
): Promise<void> {
  const clean = [...new Set(handles.filter(Boolean))];
  if (clean.length === 0) return;
  await db
    .insert(customerFavorites)
    .values(clean.map((handle) => ({ customerId, productHandle: handle })))
    .onConflictDoNothing();
}
