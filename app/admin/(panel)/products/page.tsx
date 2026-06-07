import type { Metadata } from "next";
import { fetchAdminProducts, type AdminProductRow } from "@/lib/admin-products";
import { isAdminConfigured } from "@/lib/shopify-admin";
import { getStatusMap } from "@/lib/admin/product-status";
import { DEFAULT_OPT_STATUS } from "@/lib/admin/opt-status";
import { AdminNotConfigured } from "@/components/admin/AdminNotConfigured";
import { ProductControlCenter } from "./control-center";

export const metadata: Metadata = {
  title: "Producten",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  if (!isAdminConfigured) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">Producten</h1>
        <AdminNotConfigured />
      </div>
    );
  }

  let rows: AdminProductRow[] = [];
  let hasMore = false;
  let error: string | null = null;
  try {
    const res = await fetchAdminProducts({ max: 1000 });
    hasMore = res.hasMore;
    const statusMap = await getStatusMap(res.items.map((p) => p.id));
    rows = res.items.map((p) => ({
      ...p,
      optStatus: statusMap.get(p.id) ?? DEFAULT_OPT_STATUS,
    }));
  } catch (err) {
    error = err instanceof Error ? err.message : "Onbekende fout.";
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Product Control Center
        </h1>
        <p className="text-muted-foreground text-sm">
          Live uit Shopify — zoeken, sorteren, selecteren en bulk bewerken.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Kon Shopify niet bereiken: {error}
        </div>
      ) : (
        <ProductControlCenter rows={rows} hasMore={hasMore} />
      )}
    </div>
  );
}
