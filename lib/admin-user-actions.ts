"use server";

import { eq, and, ne, count } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { adminUsers } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/guard";
import { hashPassword } from "@/lib/auth/password";
import { logActivity } from "@/lib/admin/activity";
import { ADMIN_ROLES, type AdminRole } from "@/lib/admin/roles";
import { revalidatePath } from "next/cache";

export type UserActionResult = { ok: boolean; error?: string };

function isValidRole(role: string): role is AdminRole {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

/** Maakt een nieuwe admin-gebruiker (owner-only). */
export async function createUserAction(
  _prev: UserActionResult,
  formData: FormData,
): Promise<UserActionResult> {
  const actor = await requireRole("owner");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "editor");

  if (!email || !name || !password) {
    return { ok: false, error: "E-mail, naam én wachtwoord zijn verplicht." };
  }
  if (!isValidRole(role)) return { ok: false, error: "Ongeldige rol." };
  if (password.length < 10) {
    return { ok: false, error: "Wachtwoord moet minstens 10 tekens zijn." };
  }

  const existing = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);
  if (existing.length) {
    return { ok: false, error: "Er bestaat al een gebruiker met dit e-mailadres." };
  }

  const passwordHash = await hashPassword(password);
  await db.insert(adminUsers).values({ email, name, passwordHash, role });

  await logActivity({
    actor: actor.id,
    action: "user.create",
    targetType: "admin_user",
    message: `Gebruiker ${email} aangemaakt (${role})`,
  });
  revalidatePath("/admin/instellingen");
  return { ok: true };
}

/** Wijzigt de rol van een gebruiker (owner-only). */
export async function setUserRoleAction(
  userId: string,
  role: string,
): Promise<UserActionResult> {
  const actor = await requireRole("owner");
  if (!isValidRole(role)) return { ok: false, error: "Ongeldige rol." };

  // Voorkom dat de laatste owner zichzelf degradeert.
  if (role !== "owner") {
    const target = await db
      .select({ role: adminUsers.role })
      .from(adminUsers)
      .where(eq(adminUsers.id, userId))
      .limit(1);
    if (target[0]?.role === "owner") {
      const others = await db
        .select({ n: count() })
        .from(adminUsers)
        .where(and(eq(adminUsers.role, "owner"), ne(adminUsers.id, userId)));
      if ((others[0]?.n ?? 0) === 0) {
        return { ok: false, error: "Er moet minstens één eigenaar blijven." };
      }
    }
  }

  await db.update(adminUsers).set({ role }).where(eq(adminUsers.id, userId));
  await logActivity({
    actor: actor.id,
    action: "user.role",
    targetType: "admin_user",
    targetId: userId,
    message: `Rol gewijzigd naar ${role}`,
  });
  revalidatePath("/admin/instellingen");
  return { ok: true };
}

/** Activeert/deactiveert een gebruiker (owner-only). */
export async function setUserActiveAction(
  userId: string,
  isActive: boolean,
): Promise<UserActionResult> {
  const actor = await requireRole("owner");

  if (userId === actor.id && !isActive) {
    return { ok: false, error: "Je kunt jezelf niet deactiveren." };
  }

  await db.update(adminUsers).set({ isActive }).where(eq(adminUsers.id, userId));
  await logActivity({
    actor: actor.id,
    action: "user.active",
    targetType: "admin_user",
    targetId: userId,
    message: isActive ? "Gebruiker geactiveerd" : "Gebruiker gedeactiveerd",
  });
  revalidatePath("/admin/instellingen");
  return { ok: true };
}
