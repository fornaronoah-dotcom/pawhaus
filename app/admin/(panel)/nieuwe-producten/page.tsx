import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, PackagePlus, Pencil } from "lucide-react";
import { fetchAdminProducts, type AdminProductRow } from "@/lib/admin-products";
import { isAdminConfigured } from "@/lib/shopify-admin";
import { getStatusMap } from "@/lib/admin/product-status";
import { DEFAULT_OPT_STATUS } from "@/lib/admin/opt-status";
import { AdminNotConfigured } from "@/components/admin/AdminNotConfigured";
import { PageHeader } from "@/components/admin/PageHeader";
import { Callout } from "@/components/admin/Callout";
import { EmptyState } from "@/components/admin/EmptyState";
import { ZoomableImage } from "@/components/admin/ZoomableImage";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { requireAccess } from "@/lib/auth/guard";
import { MarkDoneButton } from "./MarkDoneButton";

export const metadata: Metadata = {
  title: "Nieuwe producten",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Net toegevoegde producten worden door Shopify Flow getagd met `nieuw-product`.
const NEW_QUERY = "tag:nieuw-product";

export default async function NewProductsPage() {
  await requireAccess("/admin/nieuwe-producten");

  if (!isAdminConfigured) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Nieuwe producten" />
        <AdminNotConfigured />
      </div>
    );
  }

  let rows: AdminProductRow[] = [];
  let error: string | null = null;
  try {
    const res = await fetchAdminProducts({ query: NEW_QUERY, max: 200 });
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
        title="Nieuwe producten"
        badge={rows.length > 0 ? `${rows.length}` : undefined}
        description="Net toegevoegde producten die nog een betere naam en beschrijving nodig hebben. Vraag ze te herschrijven en markeer ze daarna als afgewerkt — dan verdwijnen ze uit deze lijst."
      />

      {error ? (
        <Callout variant="error" title="Kon Shopify niet bereiken">
          {error}
        </Callout>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={PackagePlus}
          title="Geen nieuwe producten"
          description="Zodra er een nieuw product wordt toegevoegd (tag nieuw-product), verschijnt het hier."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((p) => (
            <div
              key={p.id}
              className="bg-card ring-foreground/10 flex flex-wrap items-center gap-4 rounded-xl p-4 ring-1"
            >
              {p.image ? (
                <ZoomableImage
                  src={p.image.url}
                  alt={p.title}
                  width={80}
                  height={80}
                  className="ring-foreground/10 hover:ring-primary/40 h-20 w-20 shrink-0 rounded-lg object-cover ring-1 transition"
                />
              ) : (
                <div className="bg-muted text-muted-foreground grid h-20 w-20 shrink-0 place-items-center rounded-lg text-xs">
                  geen foto
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.title}</p>
                <p className="text-muted-foreground text-sm">
                  {[p.vendor, p.productType].filter(Boolean).join(" · ") || "—"}
                  {p.minPrice ? ` · ${formatPrice(p.minPrice)}` : ""}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {!p.hasDescription ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900">
                      geen beschrijving
                    </span>
                  ) : null}
                  {!p.hasImage ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900">
                      geen foto
                    </span>
                  ) : null}
                  {p.status !== "ACTIVE" ? (
                    <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[11px] font-medium">
                      {p.status === "DRAFT" ? "concept" : p.status.toLowerCase()}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Link href={`/admin/products/${p.numericId}`}>
                  <Button size="sm" variant="outline">
                    <Pencil className="size-4" />
                    Bewerken
                  </Button>
                </Link>
                <a
                  href={`/product/${p.handle}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button size="sm" variant="ghost">
                    <ExternalLink className="size-4" />
                    Op site
                  </Button>
                </a>
                <MarkDoneButton gid={p.id} numericId={p.numericId} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
