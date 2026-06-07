import type { Metadata } from "next";
import {
  fetchCustomers,
  CustomerScopeError,
} from "@/lib/admin-customers";
import { isAdminConfigured } from "@/lib/shopify-admin";
import { AdminNotConfigured } from "@/components/admin/AdminNotConfigured";
import { MarketingPanel, type Subscriber } from "./marketing-panel";

export const metadata: Metadata = {
  title: "Marketing",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  if (!isAdminConfigured) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">Marketing</h1>
        <AdminNotConfigured />
      </div>
    );
  }

  let subscribers: Subscriber[] = [];
  let totalCustomers = 0;
  let scopeMissing = false;
  let error: string | null = null;
  try {
    const res = await fetchCustomers({ max: 1000 });
    totalCustomers = res.items.length;
    subscribers = res.items
      .filter((c) => c.marketingSubscribed)
      .map((c) => ({
        numericId: c.numericId,
        name: c.name,
        email: c.email,
        createdAt: c.createdAt,
      }));
  } catch (err) {
    if (err instanceof CustomerScopeError) scopeMissing = true;
    else error = err instanceof Error ? err.message : "Onbekende fout.";
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Marketing &amp; e-mail</h1>
        <p className="text-muted-foreground text-sm">
          Nieuwsbrief-inschrijvingen en segmenten. Inschrijvingen worden Shopify-
          klanten met marketingtoestemming.
        </p>
      </div>

      {scopeMissing ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Scope <code>read_customers</code> nodig — autoriseer de app opnieuw (zie Klanten).
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Kon gegevens niet laden: {error}
        </div>
      ) : (
        <MarketingPanel subscribers={subscribers} totalCustomers={totalCustomers} />
      )}
    </div>
  );
}
