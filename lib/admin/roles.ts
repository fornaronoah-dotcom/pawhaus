/**
 * Rollen + toegangsregels voor het admin-paneel. Client-veilig (pure TS, geen
 * server/DB-imports) zodat zowel de sidebar (client) als de guards (server)
 * en het DB-schema dezelfde definitie delen.
 */

export const ADMIN_ROLES = [
  "owner",
  "admin",
  "marketing",
  "content",
  "editor",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ROLE_LABELS: Record<AdminRole, string> = {
  owner: "Eigenaar",
  admin: "Beheerder",
  marketing: "Marketing",
  content: "Content",
  editor: "Editor",
};

/** Rollen met volledige toegang tot alle modules. */
const FULL_ACCESS: readonly AdminRole[] = ["owner", "admin", "editor"];

/**
 * Toegestane module-basis-hrefs per beperkte rol. owner/admin/editor zien
 * alles; marketing en content zien enkel hun eigen modules. Dashboard
 * (/admin) is voor iedereen.
 */
const RESTRICTED_ACCESS: Record<"marketing" | "content", string[]> = {
  marketing: [
    "/admin",
    "/admin/analytics",
    "/admin/klanten",
    "/admin/marketing",
    "/admin/giveaways",
    "/admin/kortingen",
  ],
  content: [
    "/admin",
    "/admin/content",
    "/admin/products",
    "/admin/nieuwe-producten",
  ],
};

/** Mag deze rol de module met deze basis-href zien/openen? */
export function canAccess(role: AdminRole, href: string): boolean {
  if (FULL_ACCESS.includes(role)) return true;
  if (role === "marketing" || role === "content") {
    return RESTRICTED_ACCESS[role].includes(href);
  }
  return false;
}
