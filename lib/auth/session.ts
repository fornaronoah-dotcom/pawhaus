import "server-only";

import { randomBytes, createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { adminUsers, sessions, type AdminUser } from "@/lib/db/schema";
import { SESSION_COOKIE } from "@/lib/auth/constants";

/**
 * Sessiebeheer via httpOnly-cookie + Postgres.
 * - Het cookie bevat een willekeurig token (32 bytes, base64url).
 * - In de DB bewaren we ENKEL de SHA-256 hash van dat token, zodat een
 *   DB-lek niet meteen herbruikbare sessies oplevert.
 * - Sessies verlopen na SESSION_TTL en schuiven mee op (sliding expiry).
 */

export { SESSION_COOKIE };
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 dagen

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Maakt een nieuwe sessie aan voor een gebruiker en zet de cookie. */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  const hdrs = await headers();
  await db.insert(sessions).values({
    userId,
    tokenHash,
    expiresAt,
    ip: hdrs.get("x-forwarded-for") ?? null,
    userAgent: hdrs.get("user-agent") ?? null,
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, { ...cookieOptions, expires: expiresAt });
}

export type SessionUser = Pick<
  AdminUser,
  "id" | "email" | "name" | "role" | "isActive"
>;

/**
 * Leest de huidige sessie. Geeft de (actieve) gebruiker terug of null.
 *
 * PUUR LEZEND: zet GEEN cookie. In Next.js mogen cookies enkel in een Server
 * Action of Route Handler gewijzigd worden, niet tijdens een page-render — en
 * deze functie draait via requireAdmin() in layouts/pages. De sessie heeft
 * daarom een vaste levensduur (SESSION_TTL_MS) vanaf login.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const rows = await db
    .select({
      user: {
        id: adminUsers.id,
        email: adminUsers.email,
        name: adminUsers.name,
        role: adminUsers.role,
        isActive: adminUsers.isActive,
      },
    })
    .from(sessions)
    .innerJoin(adminUsers, eq(sessions.userId, adminUsers.id))
    .where(
      and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date())),
    )
    .limit(1);

  const row = rows[0];
  if (!row || !row.user.isActive) return null;
  return row.user;
}

/** Verwijdert de huidige sessie (logout). */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  }
  store.delete(SESSION_COOKIE);
}
