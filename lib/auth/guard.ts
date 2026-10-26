import "server-only";

import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { canAccess } from "@/lib/admin/roles";

/**
 * Verplichte authenticatie voor admin-pagina's, Server Actions en API-routes.
 * Roep dit aan bovenaan ELKE admin-action/route — de proxy (cookie-check)
 * alleen volstaat niet voor Server Actions.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** Zoals requireAdmin, maar vereist ook een specifieke rol. */
export async function requireRole(
  role: SessionUser["role"],
): Promise<SessionUser> {
  const user = await requireAdmin();
  if (role === "owner" && user.role !== "owner") {
    redirect("/admin");
  }
  return user;
}

/**
 * Vereist dat de ingelogde gebruiker toegang heeft tot de module met deze
 * basis-href (bv. "/admin/marketing"). Roep dit bovenaan een module-pagina aan;
 * geen toegang → terug naar het dashboard.
 */
export async function requireAccess(href: string): Promise<SessionUser> {
  const user = await requireAdmin();
  if (!canAccess(user.role, href)) {
    redirect("/admin");
  }
  return user;
}
