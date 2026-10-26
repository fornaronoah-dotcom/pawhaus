import type { Metadata } from "next";
import Link from "next/link";
import {
  Package,
  Users,
  Euro,
  ShoppingBag,
  ImageOff,
  FileText,
  ArrowRight,
  Activity,
} from "lucide-react";
import { isAdminConfigured } from "@/lib/shopify-admin";
import { getCoreMetrics, getOrdersSummary } from "@/lib/admin-analytics";
import { recentActivity } from "@/lib/admin/activity";
import { requireAdmin } from "@/lib/auth/guard";
import { NAV } from "@/lib/admin/nav";
import { canAccess } from "@/lib/admin/roles";
import { formatPrice } from "@/lib/utils";
import { AdminNotConfigured } from "@/components/admin/AdminNotConfigured";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Callout } from "@/components/admin/Callout";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("nl-BE", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function DashboardPage() {
  const user = await requireAdmin();
  const firstName = user.name.trim().split(/\s+/)[0] || user.name;

  if (!isAdminConfigured) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title={`Hoi ${firstName} 👋`} />
        <AdminNotConfigured />
      </div>
    );
  }

  const [metrics, orders, logs] = await Promise.all([
    getCoreMetrics().catch(() => null),
    getOrdersSummary().catch(() => null),
    recentActivity(8).catch(() => []),
  ]);

  const ordersOk = orders && !orders.scopeMissing ? orders : null;

  // Aandacht-nodig tegels (alleen tonen als er iets is).
  const attention = metrics
    ? [
        {
          label: "Zonder afbeelding",
          value: metrics.products.noImage,
          href: "/admin/products",
          icon: ImageOff,
        },
        {
          label: "Zonder beschrijving",
          value: metrics.products.noDescription,
          href: "/admin/products",
          icon: FileText,
        },
        {
          label: "Concept-producten",
          value: metrics.products.draft,
          href: "/admin/products",
          icon: Package,
        },
      ].filter((a) => a.value > 0)
    : [];

  const shortcuts = NAV.filter(
    (item) =>
      ["/admin/products", "/admin/nieuwe-producten", "/admin/analytics", "/admin/instellingen"].includes(
        item.href,
      ) && canAccess(user.role, item.href),
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Hoi ${firstName} 👋`}
        description="Overzicht van je Shopify-webshop en snelkoppelingen naar het beheer."
      />

      {/* KPI's */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Omzet (30 dagen)"
          value={ordersOk?.revenue30 ? formatPrice(ordersOk.revenue30) : ordersOk ? "€ 0,00" : "—"}
          hint={
            orders?.scopeMissing
              ? "scope read_orders nodig"
              : ordersOk?.revenueToday
                ? `vandaag ${formatPrice(ordersOk.revenueToday)}`
                : "live uit Shopify"
          }
          icon={Euro}
          tone="primary"
        />
        <StatCard
          label="Bestellingen (30 dagen)"
          value={ordersOk ? ordersOk.count30 : "—"}
          hint={ordersOk?.aov ? `gem. ${formatPrice(ordersOk.aov)}` : orders?.scopeMissing ? "scope read_orders nodig" : undefined}
          icon={ShoppingBag}
          tone="sky"
        />
        <StatCard
          label="Totaal producten"
          value={metrics ? metrics.products.total : "—"}
          hint={metrics ? `${metrics.products.active} actief · ${metrics.products.draft} concept` : undefined}
          icon={Package}
          tone="teal"
        />
        <StatCard
          label="Klanten"
          value={metrics ? metrics.customers.total : "—"}
          hint={metrics ? `${metrics.customers.subscribers} nieuwsbrief` : undefined}
          icon={Users}
          tone="brand"
        />
      </div>

      {!metrics && (
        <Callout variant="error" title="Kon Shopify-cijfers niet laden">
          Controleer de Shopify-koppeling in Instellingen.
        </Callout>
      )}

      {/* Aandacht nodig */}
      {attention.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-medium">Aandacht nodig</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {attention.map((a) => {
              const Icon = a.icon;
              return (
                <Link key={a.label} href={a.href} className="group">
                  <Card className="hover:ring-brand/40 gap-0 p-4 transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <span className="bg-brand/15 text-brand-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                        <Icon className="size-5" />
                      </span>
                      <div className="flex-1">
                        <p className="font-baloo text-2xl font-semibold tabular-nums">{a.value}</p>
                        <p className="text-muted-foreground text-xs">{a.label}</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recente activiteit */}
        <section className="flex flex-col gap-3 lg:col-span-2">
          <h2 className="text-base font-medium">Recente activiteit</h2>
          <Card className="gap-0 p-0">
            {logs.length === 0 ? (
              <div className="text-muted-foreground flex items-center gap-2 p-5 text-sm">
                <Activity className="size-4" /> Nog geen activiteit.
              </div>
            ) : (
              <ul className="divide-y">
                {logs.map((l) => (
                  <li key={l.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                    <span
                      className={`mt-1.5 size-2 shrink-0 rounded-full ${
                        l.severity === "error"
                          ? "bg-destructive"
                          : l.severity === "warn"
                            ? "bg-brand"
                            : "bg-teal"
                      }`}
                    />
                    <span className="flex-1">{l.message ?? l.action}</span>
                    <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                      {dateFmt.format(new Date(l.createdAt))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        {/* Snel naar */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-medium">Snel naar</h2>
          <div className="flex flex-col gap-3">
            {shortcuts.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="group">
                  <Card className="hover:ring-primary/30 gap-0 p-4 transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <span className="bg-accent text-accent-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                        <Icon className="size-4" />
                      </span>
                      <span className="flex-1 text-sm font-medium">{item.label}</span>
                      <ArrowRight className="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
