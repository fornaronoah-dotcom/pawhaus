import type { Metadata } from "next";
import {
  listDiscounts,
  DiscountScopeError,
  type AdminDiscount,
} from "@/lib/admin-discounts";
import { isAdminConfigured } from "@/lib/shopify-admin";
import { AdminNotConfigured } from "@/components/admin/AdminNotConfigured";
import { formatPrice } from "@/lib/utils";
import { CreateDiscountForm } from "./create-form";
import { QrButton } from "./qr-button";

export const metadata: Metadata = {
  title: "Kortingscodes",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("nl-BE", { dateStyle: "short" });
const STATUS: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: "Actief", cls: "bg-green-100 text-green-800" },
  SCHEDULED: { label: "Gepland", cls: "bg-amber-100 text-amber-800" },
  EXPIRED: { label: "Verlopen", cls: "bg-muted text-muted-foreground" },
};

export default async function KortingenPage() {
  if (!isAdminConfigured) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">Kortingscodes</h1>
        <AdminNotConfigured />
      </div>
    );
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    `https://${(process.env.SHOPIFY_SHOP_DOMAIN ?? process.env.SHOPIFY_STORE_DOMAIN ?? "").replace(/^https?:\/\//, "")}`;

  let discounts: AdminDiscount[] = [];
  let scopeMissing = false;
  let error: string | null = null;
  try {
    discounts = await listDiscounts(100);
  } catch (err) {
    if (err instanceof DiscountScopeError) scopeMissing = true;
    else error = err instanceof Error ? err.message : "Onbekende fout.";
  }

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Kortingscodes</h1>
        <p className="text-muted-foreground text-sm">
          Maak kortingscodes aan in Shopify (Shopify blijft bron van waarheid).
        </p>
      </div>

      {scopeMissing ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Eenmalige toestemming nodig: <code>write_discounts</code></p>
          <p className="mt-1">
            Je Shopify-token heeft nog geen rechten voor kortingen. Voeg de scope
            toe in de Dev Dashboard-app en autoriseer opnieuw — daarna werkt deze
            module meteen. (Vraag de assistent om je door de korte her-autorisatie
            te loodsen.)
          </p>
        </div>
      ) : null}

      <CreateDiscountForm />

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Kon kortingen niet laden: {error}
        </div>
      ) : !scopeMissing ? (
        <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-3 py-2 font-medium">Code</th>
                <th className="px-3 py-2 font-medium">Korting</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Gebruikt</th>
                <th className="px-3 py-2 font-medium">Vervalt</th>
                <th className="px-3 py-2 font-medium">QR</th>
              </tr>
            </thead>
            <tbody>
              {discounts.length === 0 ? (
                <tr><td colSpan={6} className="text-muted-foreground px-3 py-4">Nog geen kortingscodes.</td></tr>
              ) : (
                discounts.map((d) => {
                  const s = STATUS[d.status] ?? STATUS.ACTIVE;
                  return (
                    <tr key={d.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="px-3 py-2 font-medium">{d.code}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {d.type === "percentage"
                          ? `${d.percentage}%`
                          : d.amount ? formatPrice(d.amount) : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>
                      </td>
                      <td className="px-3 py-2">
                        {d.usageCount}{d.usageLimit ? ` / ${d.usageLimit}` : ""}
                      </td>
                      <td className="text-muted-foreground px-3 py-2 whitespace-nowrap">
                        {d.endsAt ? dateFmt.format(new Date(d.endsAt)) : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <QrButton code={d.code} baseUrl={baseUrl} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
