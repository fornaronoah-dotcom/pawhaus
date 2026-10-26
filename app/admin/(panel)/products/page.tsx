import type { Metadata } from "next";
import { fetchAdminProducts, type AdminProductRow } from "@/lib/admin-products";
import { isAdminConfigured } from "@/lib/shopify-admin";
import { getStatusMap } from "@/lib/admin/product-status";
import { DEFAULT_OPT_STATUS } from "@/lib/admin/opt-status";
import { AdminNotConfigured } from "@/components/admin/AdminNotConfigured";
import { PageHeader } from "@/components/admin/PageHeader";
import { Callout } from "@/components/admin/Callout";
import { requireAccess } from "@/lib/auth/guard";
import { ProductControlCenter } from "./control-center";

export const metadata: Metadata = {
  title: "Producten",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  await requireAccess("/admin/products");

  if (!isAdminConfigured) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Producten" />
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
      <PageHeader
        title="Product Control Center"
        description="Live uit Shopify — zoeken, sorteren, selecteren en bulk bewerken."
      />

      {error ? (
        <Callout variant="error" title="Kon Shopify niet bereiken">
          {error}
        </Callout>
      ) : (
        <ProductControlCenter rows={rows} hasMore={hasMore} />
      )}
    </div>
  );
}
