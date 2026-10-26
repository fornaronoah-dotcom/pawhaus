"use server";

import { getCustomerSession } from "@/lib/customer/session";
import {
  getFavorites,
  mergeFavorites,
  toggleFavorite,
} from "@/lib/favorites";
import { logActivity } from "@/lib/admin/activity";

/**
 * Server-actions voor favorieten, aangeroepen door de FavoritesProvider.
 * Werken enkel voor ingelogde klanten; gasten bewaren favorieten lokaal.
 */

export type FavoritesResult = {
  ok: boolean;
  /** De volledige server-lijst na de bewerking (handles). */
  favorites?: string[];
  favorited?: boolean;
  error?: string;
};

/** Toggelt een favoriet voor de ingelogde klant. */
export async function toggleFavoriteAction(
  handle: string,
): Promise<FavoritesResult> {
  const session = await getCustomerSession();
  if (!session) return { ok: false, error: "not-authenticated" };

  const { favorited } = await toggleFavorite(session.customerId, handle);
  await logActivity({
    actor: `customer:${session.customerId}`,
    action: favorited ? "favorite.add" : "favorite.remove",
    targetType: "product",
    targetId: handle,
  });
  const favorites = await getFavorites(session.customerId);
  return { ok: true, favorited, favorites };
}

/** Merge't gast-favorieten (uit localStorage) in het account na inloggen. */
export async function mergeFavoritesAction(
  handles: string[],
): Promise<FavoritesResult> {
  const session = await getCustomerSession();
  if (!session) return { ok: false, error: "not-authenticated" };

  await mergeFavorites(session.customerId, handles);
  const favorites = await getFavorites(session.customerId);
  return { ok: true, favorites };
}

/** Geeft de huidige server-favorieten terug (of leeg voor gasten). */
export async function getFavoritesAction(): Promise<FavoritesResult> {
  const session = await getCustomerSession();
  if (!session) return { ok: false, error: "not-authenticated" };
  const favorites = await getFavorites(session.customerId);
  return { ok: true, favorites };
}
