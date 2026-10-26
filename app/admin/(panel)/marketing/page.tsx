import type { Metadata } from "next";
import {
  fetchCustomers,
  CustomerScopeError,
} from "@/lib/admin-customers";
import { isAdminConfigured } from "@/lib/shopify-admin";
import { AdminNotConfigured } from "@/components/admin/AdminNotConfigured";
import { PageHeader } from "@/components/admin/PageHeader";
import { Callout } from "@/components/admin/Callout";
import { requireAccess } from "@/lib/auth/guard";
import { MarketingPanel, type Subscriber } from "./marketing-panel";

export const metadata: Metadata = {
  title: "Marketing",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  await requireAccess("/admin/marketing");

  if (!isAdminConfigured) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Marketing" />
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
      <PageHeader
        title="Marketing & e-mail"
        description="Nieuwsbrief-inschrijvingen en segmenten. Inschrijvingen worden Shopify-klanten met marketingtoestemming."
      />

      {scopeMissing ? (
        <Callout variant="warning">
          Scope <code>read_customers</code> nodig — autoriseer de app opnieuw (zie Klanten).
        </Callout>
      ) : error ? (
        <Callout variant="error" title="Kon gegevens niet laden">
          {error}
        </Callout>
      ) : (
        <MarketingPanel subscribers={subscribers} totalCustomers={totalCustomers} />
      )}
    </div>
  );
}
