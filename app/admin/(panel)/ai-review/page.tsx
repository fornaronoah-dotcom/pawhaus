import type { Metadata } from "next";
import { fetchAdminProducts, type AdminProductRow } from "@/lib/admin-products";
import { isAdminConfigured } from "@/lib/shopify-admin";
import { getStatusMap } from "@/lib/admin/product-status";
import { DEFAULT_OPT_STATUS } from "@/lib/admin/opt-status";
import { AdminNotConfigured } from "@/components/admin/AdminNotConfigured";
import { ProductControlCenter } from "../products/control-center";

export const metadata: Metadata = {
  title: "AI-review",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Producten die wachten op controle/AI: tag nieuw-product OF klaar-voor-ai.
const REVIEW_QUERY = "tag:nieuw-product OR tag:klaar-voor-ai";

export default async function AiReviewPage() {
  if (!isAdminConfigured) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">AI-review</h1>
        <AdminNotConfigured />
      </div>
    );
  }

  let rows: AdminProductRow[] = [];
  let error: string | null = null;
  try {
    const res = await fetchAdminProducts({ query: REVIEW_QUERY, max: 500 });
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
        <h1 className="text-2xl font-semibold tracking-tight">AI-review</h1>
        <p className="text-muted-foreground text-sm">
          Nieuwe producten (tag <code>nieuw-product</code>) en producten gemarkeerd
          als <code>klaar-voor-ai</code>. Controleer, selecteer en markeer ze hier —
          AI-verbetering volgt in een latere fase.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Kon Shopify niet bereiken: {error}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Geen producten met tag <code>nieuw-product</code> of{" "}
          <code>klaar-voor-ai</code>. Je Shopify Flow voegt <code>nieuw-product</code>{" "}
          toe bij nieuwe producten; markeer er hier zelf met &quot;AI review tag&quot;.
        </p>
      ) : (
        <ProductControlCenter rows={rows} hasMore={false} />
      )}
    </div>
  );
}
