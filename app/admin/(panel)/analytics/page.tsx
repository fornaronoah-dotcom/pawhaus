import type { Metadata } from "next";
import { getCoreMetrics, getOrdersSummary } from "@/lib/admin-analytics";
import { isAdminConfigured } from "@/lib/shopify-admin";
import { AdminNotConfigured } from "@/components/admin/AdminNotConfigured";
import { OPT_STATUS_LABELS } from "@/lib/admin/opt-status";
import { formatPrice } from "@/lib/utils";
import type { OptStatus } from "@/lib/db/schema";

export const metadata: Metadata = {
  title: "Analytics",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
      {sub ? <p className="text-muted-foreground text-xs">{sub}</p> : null}
    </div>
  );
}

export default async function AnalyticsPage() {
  if (!isAdminConfigured) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
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
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Kon analytics niet laden: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm">Live overzicht van je winkel.</p>
      </div>

      {/* Omzet */}
      <section className="flex flex-col gap-2">
        <h2 className="text-base font-medium">Omzet (laatste 30 dagen)</h2>
        {orders && orders.scopeMissing ? (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            Voeg de scope <code>read_orders</code> toe (app 378135740417) en autoriseer opnieuw om omzet, bestellingen en gemiddelde orderwaarde te zien.
          </div>
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
