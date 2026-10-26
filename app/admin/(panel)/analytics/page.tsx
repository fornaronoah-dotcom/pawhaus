import type { Metadata } from "next";
import { getCoreMetrics, getOrdersSummary } from "@/lib/admin-analytics";
import { isAdminConfigured } from "@/lib/shopify-admin";
import { AdminNotConfigured } from "@/components/admin/AdminNotConfigured";
import { PageHeader } from "@/components/admin/PageHeader";
import { Callout } from "@/components/admin/Callout";
import { requireAccess } from "@/lib/auth/guard";
import { OPT_STATUS_LABELS } from "@/lib/admin/opt-status";
import { formatPrice } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { OptStatus } from "@/lib/db/schema";

export const metadata: Metadata = {
  title: "Analytics",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card className="gap-0 p-5">
      <p className="text-muted-foreground text-sm font-medium">{label}</p>
      <p className="font-baloo mt-2 text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {sub ? <p className="text-muted-foreground mt-1 text-xs">{sub}</p> : null}
    </Card>
  );
}

export default async function AnalyticsPage() {
  await requireAccess("/admin/analytics");

  if (!isAdminConfigured) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Analytics" />
        <AdminNotConfigured />
      </div>
    );
  }

  let m: Awaited<ReturnType<typeof getCoreMetrics>> | null = null;
  let orders: Awaited<ReturnType<typeof getOrdersSummary>> | null = null;
  let error: string | null = null;
  try {
    [m, orders] = await Promise.all([getCoreMetrics(), getOrdersSummary()]);
  } catch (err) {
    error = err instanceof Error ? err.message : "Onbekende fout.";
  }

  if (error || !m) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Analytics" />
        <Callout variant="error" title="Kon analytics niet laden">
          {error}
        </Callout>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Analytics" description="Live overzicht van je winkel." />

      {/* Omzet */}
      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium">Omzet (laatste 30 dagen)</h2>
        {orders && orders.scopeMissing ? (
          <Callout variant="warning">
            Voeg de scope <code>read_orders</code> toe (app 378135740417) en autoriseer opnieuw om omzet, bestellingen en gemiddelde orderwaarde te zien.
          </Callout>
        ) : orders && !orders.scopeMissing ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Omzet vandaag" value={orders.revenueToday ? formatPrice(orders.revenueToday) : "€ 0,00"} />
            <Stat label="Omzet 30 dagen" value={orders.revenue30 ? formatPrice(orders.revenue30) : "€ 0,00"} sub={orders.capped ? "(eerste 250 orders)" : undefined} />
            <Stat label="Bestellingen 30d" value={orders.count30} />
            <Stat label="Gem. orderwaarde" value={orders.aov ? formatPrice(orders.aov) : "—"} />
          </div>
        ) : null}
      </section>

      {/* Producten */}
      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium">Producten</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Totaal producten" value={m.products.total} />
          <Stat label="Actief" value={m.products.active} sub={`${m.products.draft} concept · ${m.products.archived} gearchiveerd`} />
          <Stat label="Zonder afbeelding" value={m.products.noImage} />
          <Stat label="Zonder beschrijving" value={m.products.noDescription} />
        </div>
      </section>

      {/* Voorraad & marge */}
      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium">Voorraad &amp; marge</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Voorraad (stuks)" value={m.inventory.units} />
          <Stat label="Voorraadwaarde (inkoop)" value={m.inventory.value ? formatPrice(m.inventory.value) : "—"} />
          <Stat label="Gem. marge" value={m.inventory.avgMargin != null ? `${m.inventory.avgMargin}%` : "—"} />
        </div>
      </section>

      {/* AI-optimalisatie */}
      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium">AI-optimalisatiestatus</h2>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {(Object.keys(OPT_STATUS_LABELS) as OptStatus[]).map((k) => (
            <Stat key={k} label={OPT_STATUS_LABELS[k]} value={m!.ai[k]} />
          ))}
        </div>
      </section>

      {/* Klanten & giveaways */}
      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium">Klanten &amp; acties</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Klanten" value={m.customers.total} />
          <Stat label="Nieuwsbrief-abonnees" value={m.customers.subscribers} />
          <Stat label="Giveaways" value={m.giveaways.total} sub={`${m.giveaways.open} open`} />
          <Stat label="Giveaway-deelnames" value={m.giveaways.entries} />
        </div>
      </section>
    </div>
  );
}
