import type { Metadata } from "next";
import {
  fetchCustomers,
  CustomerScopeError,
  type AdminCustomer,
} from "@/lib/admin-customers";
import { isAdminConfigured } from "@/lib/shopify-admin";
import { AdminNotConfigured } from "@/components/admin/AdminNotConfigured";
import { PageHeader } from "@/components/admin/PageHeader";
import { Callout } from "@/components/admin/Callout";
import { requireAccess } from "@/lib/auth/guard";
import { KlantenList } from "./klanten-list";

export const metadata: Metadata = {
  title: "Klanten",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function KlantenPage() {
  await requireAccess("/admin/klanten");

  if (!isAdminConfigured) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Klanten" />
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
      <PageHeader
        title="Klanten (CRM)"
        description="Live uit Shopify — zoeken, segmenteren en exporteren. Shopify blijft bron van waarheid."
      />

      {scopeMissing ? (
        <Callout variant="warning" title={<>Eenmalige toestemming nodig: <code>read_customers</code></>}>
          Voeg de scope toe aan de juiste Dev Dashboard-app (378135740417) en
          autoriseer opnieuw — daarna werkt deze module meteen. Vraag de
          assistent om je door de korte her-autorisatie te loodsen.
        </Callout>
      ) : error ? (
        <Callout variant="error" title="Kon klanten niet laden">
          {error}
        </Callout>
      ) : (
        <KlantenList customers={customers} />
      )}
    </div>
  );
}
