"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { adminUsers } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

export type LoginState = { error?: string };

/**
 * Login-action. Bewust generieke foutmelding (geen onderscheid tussen
 * "onbekende e-mail" en "fout wachtwoord") om enumeratie te beperken.
 */
export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (!email || !password) {
    return { error: "Vul e-mail en wachtwoord in." };
  }

  const rows = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);
  const user = rows[0];

  const ok =
    user && user.isActive && (await verifyPassword(user.passwordHash, password));
  if (!ok) {
    return { error: "Ongeldige inloggegevens." };
  }

  await db
    .update(adminUsers)
    .set({ lastLoginAt: new Date() })
    .where(eq(adminUsers.id, user.id));
  await createSession(user.id);

  // Alleen interne paden toelaten (open-redirect bescherming).
  const target = next.startsWith("/admin") ? next : "/admin";
  redirect(target);
}
