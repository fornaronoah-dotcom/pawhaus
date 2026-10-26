import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCustomerDetail } from "@/lib/admin-customers";
import { isAdminConfigured } from "@/lib/shopify-admin";
import { AdminNotConfigured } from "@/components/admin/AdminNotConfigured";
import { PageHeader } from "@/components/admin/PageHeader";
import { Breadcrumb } from "@/components/admin/Breadcrumb";
import { Callout } from "@/components/admin/Callout";
import { StatCard } from "@/components/admin/StatCard";
import { requireAccess } from "@/lib/auth/guard";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Klant",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("nl-BE", { dateStyle: "medium" });

const CRUMBS = [
  { label: "Klanten", href: "/admin/klanten" },
  { label: "Klant" },
];

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAccess("/admin/klanten");
  const { id } = await params;

  if (!isAdminConfigured) {
    return (
      <div className="flex flex-col gap-6">
        <Breadcrumb items={CRUMBS} />
        <AdminNotConfigured />
      </div>
    );
  }

  let customer: Awaited<ReturnType<typeof getCustomerDetail>> = null;
  let error: string | null = null;
  try {
    customer = await getCustomerDetail(id);
  } catch (err) {
    error = err instanceof Error ? err.message : "Onbekende fout.";
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <Breadcrumb items={CRUMBS} />
        <Callout variant="error" title="Kon klant niet laden">
          {error}
        </Callout>
      </div>
    );
  }
  if (!customer) notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Breadcrumb items={[...CRUMBS.slice(0, -1), { label: customer.name }]} />

      <PageHeader
        title={customer.name}
        badge={
          customer.marketingSubscribed ? (
            <span className="bg-teal/10 text-teal rounded-full px-2 py-0.5 text-xs font-medium">
              nieuwsbrief
            </span>
          ) : undefined
        }
      />

      <div className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-1 text-sm">
        {customer.email ? <span>{customer.email}</span> : null}
        {customer.phone ? <span>{customer.phone}</span> : null}
        {customer.city || customer.country ? (
          <span>{[customer.city, customer.country].filter(Boolean).join(", ")}</span>
        ) : null}
        <span>Klant sinds {dateFmt.format(new Date(customer.createdAt))}</span>
      </div>

      {/* 360 stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Totaal besteed" value={customer.spent ? formatPrice(customer.spent) : "€ 0,00"} tone="primary" />
        <StatCard label="Bestellingen" value={customer.orders} tone="sky" />
        <StatCard label="Gem. orderwaarde" value={customer.aov ? formatPrice(customer.aov) : "—"} tone="teal" />
        <StatCard label="Laatste aankoop" value={customer.lastOrderAt ? dateFmt.format(new Date(customer.lastOrderAt)) : "—"} tone="brand" />
      </div>

      {/* Tags + gebruikte kortingen + notities */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <p className="mb-1 text-sm font-medium">Tags</p>
          <p className="text-muted-foreground text-sm">{customer.tags.length ? customer.tags.join(", ") : "—"}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="mb-1 text-sm font-medium">Gebruikte kortingscodes</p>
          <p className="text-muted-foreground text-sm">{customer.usedDiscounts.length ? customer.usedDiscounts.join(", ") : "—"}</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <p className="mb-1 text-sm font-medium">Notities (uit Shopify)</p>
        <p className="text-muted-foreground text-sm whitespace-pre-wrap">{customer.note || "—"}</p>
      </div>

      {/* Bestellingen */}
      <div>
        <h2 className="mb-2 text-base font-medium">Bestellingen</h2>
        {customer.orderList.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nog geen bestellingen.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted/60 text-muted-foreground text-left text-xs uppercase tracking-wide">
                  <th className="px-3 py-2.5 font-medium">Order</th>
                  <th className="px-3 py-2.5 font-medium">Datum</th>
                  <th className="px-3 py-2.5 font-medium">Bedrag</th>
                  <th className="px-3 py-2.5 font-medium">Betaling</th>
                  <th className="px-3 py-2.5 font-medium">Levering</th>
                  <th className="px-3 py-2.5 font-medium">Korting</th>
                </tr>
              </thead>
              <tbody>
                {customer.orderList.map((o) => (
                  <tr key={o.id} className="hover:bg-accent/40 border-t border-border/60 transition-colors">
                    <td className="px-3 py-2.5 font-medium">{o.name}</td>
                    <td className="text-muted-foreground px-3 py-2.5 whitespace-nowrap tabular-nums">{dateFmt.format(new Date(o.createdAt))}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">{formatPrice(o.total)}</td>
                    <td className="px-3 py-2">{o.financialStatus}</td>
                    <td className="px-3 py-2">{o.fulfillmentStatus}</td>
                    <td className="text-muted-foreground px-3 py-2">{o.discountCodes.join(", ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
