import type { Metadata } from "next";
import {
  fetchCustomers,
  CustomerScopeError,
  type AdminCustomer,
} from "@/lib/admin-customers";
import { isAdminConfigured } from "@/lib/shopify-admin";
import { AdminNotConfigured } from "@/components/admin/AdminNotConfigured";
import { KlantenList } from "./klanten-list";

export const metadata: Metadata = {
  title: "Klanten",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function KlantenPage() {
  if (!isAdminConfigured) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">Klanten</h1>
        <AdminNotConfigured />
      </div>
    );
  }

  let customers: AdminCustomer[] = [];
  let scopeMissing = false;
  let error: string | null = null;
  try {
    const res = await fetchCustomers({ max: 1000 });
    customers = res.items;
  } catch (err) {
    if (err instanceof CustomerScopeError) scopeMissing = true;
    else error = err instanceof Error ? err.message : "Onbekende fout.";
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Klanten (CRM)</h1>
        <p className="text-muted-foreground text-sm">
          Live uit Shopify — zoeken, segmenteren en exporteren. Shopify blijft bron van waarheid.
        </p>
      </div>

      {scopeMissing ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Eenmalige toestemming nodig: <code>read_customers</code></p>
          <p className="mt-1">
            Voeg de scope toe aan de juiste Dev Dashboard-app (378135740417) en
            autoriseer opnieuw — daarna werkt deze module meteen. Vraag de
            assistent om je door de korte her-autorisatie te loodsen.
          </p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Kon klanten niet laden: {error}
        </div>
      ) : (
        <KlantenList customers={customers} />
      )}
    </div>
  );
}
