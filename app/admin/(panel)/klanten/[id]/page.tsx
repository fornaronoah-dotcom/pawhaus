import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerDetail } from "@/lib/admin-customers";
import { isAdminConfigured } from "@/lib/shopify-admin";
import { AdminNotConfigured } from "@/components/admin/AdminNotConfigured";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Klant",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("nl-BE", { dateStyle: "medium" });

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isAdminConfigured) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink />
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
        <BackLink />
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Kon klant niet laden: {error}
        </div>
      </div>
    );
  }
  if (!customer) notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <BackLink />

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{customer.name}</h1>
        {customer.marketingSubscribed ? (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
            nieuwsbrief
          </span>
        ) : null}
      </div>

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
        <Stat label="Totaal besteed" value={customer.spent ? formatPrice(customer.spent) : "€ 0,00"} />
        <Stat label="Bestellingen" value={customer.orders} />
        <Stat label="Gem. orderwaarde" value={customer.aov ? formatPrice(customer.aov) : "—"} />
        <Stat label="Laatste aankoop" value={customer.lastOrderAt ? dateFmt.format(new Date(customer.lastOrderAt)) : "—"} />
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
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-3 py-2 font-medium">Order</th>
                  <th className="px-3 py-2 font-medium">Datum</th>
                  <th className="px-3 py-2 font-medium">Bedrag</th>
                  <th className="px-3 py-2 font-medium">Betaling</th>
                  <th className="px-3 py-2 font-medium">Levering</th>
                  <th className="px-3 py-2 font-medium">Korting</th>
                </tr>
              </thead>
              <tbody>
                {customer.orderList.map((o) => (
                  <tr key={o.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-3 py-2 font-medium">{o.name}</td>
                    <td className="text-muted-foreground px-3 py-2 whitespace-nowrap">{dateFmt.format(new Date(o.createdAt))}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatPrice(o.total)}</td>
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

function BackLink() {
  return (
    <Link href="/admin/klanten" className="text-muted-foreground hover:text-foreground text-sm">
      ← Terug naar klanten
    </Link>
  );
}
