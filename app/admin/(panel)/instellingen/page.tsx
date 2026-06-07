import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/guard";
import { db } from "@/lib/db/client";
import { adminUsers } from "@/lib/db/schema";
import { getFlagMap } from "@/lib/admin/feature-flags";
import { isAdminConfigured } from "@/lib/shopify-admin";
import { ModuleToggles } from "./module-toggles";

export const metadata: Metadata = {
  title: "Instellingen",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("nl-BE", { dateStyle: "short", timeStyle: "short" });

export default async function SettingsPage() {
  const user = await requireAdmin();
  const [flags, users] = await Promise.all([
    getFlagMap(),
    db
      .select({
        id: adminUsers.id,
        email: adminUsers.email,
        name: adminUsers.name,
        role: adminUsers.role,
        isActive: adminUsers.isActive,
        lastLoginAt: adminUsers.lastLoginAt,
      })
      .from(adminUsers)
      .orderBy(desc(adminUsers.createdAt)),
  ]);

  const domain = (
    process.env.SHOPIFY_SHOP_DOMAIN ?? process.env.SHOPIFY_STORE_DOMAIN
  )?.replace(/^https?:\/\//, "");
  const isOwner = user.role === "owner";

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <h1 className="text-2xl font-semibold tracking-tight">Instellingen</h1>

      {/* Shopify-koppeling */}
      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium">Shopify-koppeling</h2>
        <div className="rounded-xl border bg-card p-4 text-sm">
          <p>
            Status:{" "}
            {isAdminConfigured ? (
              <span className="font-medium text-green-700">✓ verbonden</span>
            ) : (
              <span className="text-destructive font-medium">niet geconfigureerd</span>
            )}
          </p>
          <p className="text-muted-foreground">Winkel: {domain ?? "—"}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Admin API-token staat veilig server-side (wordt nooit getoond).
            Productrechten actief. Voor latere modules (kortingen, klanten) zijn
            extra scopes + her-autorisatie nodig.
          </p>
        </div>
      </section>

      {/* Modules */}
      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium">Modules</h2>
        <p className="text-muted-foreground text-sm">
          Activeer modules geleidelijk. {isOwner ? "" : "Alleen de owner kan dit wijzigen."}
        </p>
        <ModuleToggles flags={flags} canEdit={isOwner} />
      </section>

      {/* Gebruikers */}
      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium">Gebruikers</h2>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-3 py-2 font-medium">Naam</th>
                <th className="px-3 py-2 font-medium">E-mail</th>
                <th className="px-3 py-2 font-medium">Rol</th>
                <th className="px-3 py-2 font-medium">Actief</th>
                <th className="px-3 py-2 font-medium">Laatste login</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="px-3 py-2">{u.name}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">{u.role}</td>
                  <td className="px-3 py-2">{u.isActive ? "ja" : "nee"}</td>
                  <td className="text-muted-foreground px-3 py-2">
                    {u.lastLoginAt ? dateFmt.format(new Date(u.lastLoginAt)) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-muted-foreground text-xs">
          Nieuwe gebruikers toevoegen kan via het <code>create-admin</code>-script.
          Rollenbeheer (admin/marketing/content) volgt in een latere fase.
        </p>
      </section>
    </div>
  );
}
