"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import {
  mergeFavoritesAction,
  toggleFavoriteAction,
} from "@/lib/favorites-actions";

/**
 * Favorieten-state voor de hele storefront.
 *
 * - Gasten: favorieten leven in localStorage (sleutel `pawhaus_favorites`).
 * - Ingelogd: de server (Postgres) is leidend. Bij mount worden lokale
 *   gast-favorieten ge-merged naar het account, daarna volgt de server.
 * - Bij elke wijziging schrijven we ook naar localStorage (cache + gast-fallback).
 */

const STORAGE_KEY = "pawhaus_favorites";

type FavoritesContextValue = {
  favorites: string[];
  isFavorite: (handle: string) => boolean;
  toggle: (handle: string) => void;
  count: number;
  /** True zodra localStorage is uitgelezen (voorkomt hydration-mismatch). */
  hydrated: boolean;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function readLocal(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((h) => typeof h === "string") : [];
  } catch {
    return [];
  }
}

function writeLocal(list: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* localStorage niet beschikbaar — negeren */
  }
}

export function FavoritesProvider({
  initialFavorites,
  isAuthed,
  children,
}: {
  initialFavorites: string[];
  isAuthed: boolean;
  children: React.ReactNode;
}) {
  const [favorites, setFavorites] = useState<string[]>(initialFavorites);
  const [hydrated, setHydrated] = useState(false);
  const [, startTransition] = useTransition();

  // Mount: localStorage uitlezen en (indien ingelogd) gast-favorieten mergen.
  useEffect(() => {
    const local = readLocal();

    if (isAuthed) {
      const serverSet = new Set(initialFavorites);
      const localOnly = local.filter((h) => !serverSet.has(h));
      if (localOnly.length > 0) {
        startTransition(async () => {
          const res = await mergeFavoritesAction(local);
          if (res.ok && res.favorites) {
            setFavorites(res.favorites);
            writeLocal(res.favorites);
          }
        });
      } else {
        writeLocal(initialFavorites);
      }
    } else {
      // Hydratie vanuit localStorage (alleen client) — bewust synchroon.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFavorites(local);
    }

    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = useCallback(
    (handle: string) => {
      setFavorites((prev) => {
        const has = prev.includes(handle);
        const next = has
          ? prev.filter((h) => h !== handle)
          : [handle, ...prev];
        writeLocal(next);
        // Toast buiten de render-fase plannen.
        queueMicrotask(() =>
          toast.success(
            has ? "Verwijderd uit favorieten" : "Toegevoegd aan favorieten",
          ),
        );
        if (isAuthed) {
          startTransition(async () => {
            const res = await toggleFavoriteAction(handle);
            if (res.ok && res.favorites) {
              setFavorites(res.favorites);
              writeLocal(res.favorites);
            }
          });
        }
        return next;
      });
    },
    [isAuthed],
  );

  const isFavorite = useCallback(
    (handle: string) => favorites.includes(handle),
    [favorites],
  );

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorite,
        toggle,
        count: favorites.length,
        hydrated,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites moet binnen een FavoritesProvider gebruikt worden.");
  }
  return ctx;
}
