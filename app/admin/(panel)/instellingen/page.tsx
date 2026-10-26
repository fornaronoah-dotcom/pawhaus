import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { requireAccess } from "@/lib/auth/guard";
import { db } from "@/lib/db/client";
import { adminUsers } from "@/lib/db/schema";
import { getFlagMap } from "@/lib/admin/feature-flags";
import { isAdminConfigured } from "@/lib/shopify-admin";
import { PageHeader } from "@/components/admin/PageHeader";
import { ModuleToggles } from "./module-toggles";
import { UsersAdmin } from "./users-admin";

export const metadata: Metadata = {
  title: "Instellingen",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("nl-BE", { dateStyle: "short", timeStyle: "short" });

export default async function SettingsPage() {
  const user = await requireAccess("/admin/instellingen");
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
      <PageHeader title="Instellingen" />

      {/* Shopify-koppeling */}
      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium">Shopify-koppeling</h2>
        <div className="bg-card rounded-xl p-4 text-sm ring-1 ring-foreground/10">
          <p className="flex items-center gap-2">
            Status:{" "}
            {isAdminConfigured ? (
              <span className="bg-teal/10 text-teal inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
                ● verbonden
              </span>
            ) : (
              <span className="bg-destructive/10 text-destructive inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
                ● niet geconfigureerd
              </span>
            )}
          </p>
          <p className="text-muted-foreground mt-1">Winkel: {domain ?? "—"}</p>
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
        <p className="text-muted-foreground text-sm">
          {isOwner
            ? "Voeg gebruikers toe, wijzig rollen of (de)activeer ze. Rollen bepalen welke modules zichtbaar zijn."
            : "Alleen de owner kan gebruikers en rollen beheren."}
        </p>
        <UsersAdmin
          users={users.map((u) => ({
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role,
            isActive: u.isActive,
            lastLogin: u.lastLoginAt ? dateFmt.format(new Date(u.lastLoginAt)) : null,
          }))}
          canEdit={isOwner}
          currentUserId={user.id}
        />
      </section>
    </div>
  );
}
