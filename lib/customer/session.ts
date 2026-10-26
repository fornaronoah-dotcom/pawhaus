import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  decodeCustomerId,
  refreshTokens,
  type TokenSet,
} from "@/lib/customer/oauth";
import { isCustomerAccountsConfigured } from "@/lib/customer/config";

/**
 * Klant-sessiebeheer voor de Customer Account API.
 *
 * De OAuth-tokens worden in aparte httpOnly-cookies bewaard (stateless; geen
 * DB-sessie nodig). Het access-token leeft ~1 uur en wordt indien nodig
 * vernieuwd met het refresh-token. Cookies kunnen in Next.js alleen geschreven
 * worden binnen een Route Handler of Server Action — niet tijdens page-render.
 * getValidAccessToken() probeert daarom te persisteren, maar negeert stil een
 * fout tijdens render (het verse token wordt dan enkel voor die request gebruikt).
 */

const AT = "customer_at"; // access token
const RT = "customer_rt"; // refresh token
const IDT = "customer_idt"; // id token (bevat customer-id)
const EXP = "customer_exp"; // access-token verloop (epoch ms)

const COOKIE_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 dagen (refresh-token-venster)

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

/** Schrijft de token-cookies. Alleen aanroepen in route handlers / actions. */
export async function setCustomerTokens(tokens: TokenSet): Promise<void> {
  const store = await cookies();
  const expires = new Date(Date.now() + COOKIE_TTL_MS);
  store.set(AT, tokens.accessToken, { ...cookieOptions, expires });
  store.set(RT, tokens.refreshToken, { ...cookieOptions, expires });
  store.set(IDT, tokens.idToken, { ...cookieOptions, expires });
  store.set(EXP, String(tokens.expiresAt), { ...cookieOptions, expires });
}

/** Wist de klant-sessie (logout). */
export async function clearCustomerSession(): Promise<void> {
  const store = await cookies();
  for (const name of [AT, RT, IDT, EXP]) store.delete(name);
}

export type CustomerSession = {
  customerId: string;
  idToken: string;
};

/**
 * Leest de huidige klant-sessie (puur lezend, geen cookie-writes).
 * Geeft null terug als niemand is ingelogd of accounts niet geconfigureerd zijn.
 */
export async function getCustomerSession(): Promise<CustomerSession | null> {
  if (!isCustomerAccountsConfigured) return null;
  const store = await cookies();
  const idToken = store.get(IDT)?.value;
  const accessToken = store.get(AT)?.value;
  if (!idToken || !accessToken) return null;
  const customerId = decodeCustomerId(idToken);
  if (!customerId) return null;
  return { customerId, idToken };
}

/** Redirect naar login als er geen geldige sessie is; geeft anders de sessie terug. */
export async function requireCustomer(): Promise<CustomerSession> {
  const session = await getCustomerSession();
  if (!session) redirect("/api/auth/customer/login");
  return session;
}

/**
 * Geeft een geldig access-token terug; vernieuwt het indien (bijna) verlopen.
 * Gebruikt door de Customer Account API-fetchlaag.
 */
export async function getValidAccessToken(): Promise<string | null> {
  if (!isCustomerAccountsConfigured) return null;
  const store = await cookies();
  const accessToken = store.get(AT)?.value;
  const refreshToken = store.get(RT)?.value;
  const exp = Number(store.get(EXP)?.value ?? 0);

  // Nog geldig (met 60s marge)?
  if (accessToken && exp - 60_000 > Date.now()) return accessToken;
  if (!refreshToken) return accessToken ?? null;

  try {
    const next = await refreshTokens(refreshToken);
    // Best-effort persisteren (lukt in route handler / action; faalt stil in render).
    try {
      await setCustomerTokens(next);
    } catch {
      /* cookie-write tijdens render — negeren, token geldt voor deze request */
    }
    return next.accessToken;
  } catch (err) {
    console.error("[customer] token-refresh mislukt:", err);
    return accessToken ?? null;
  }
}
