import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminProduct } from "@/lib/admin-products";
import { isAdminConfigured } from "@/lib/shopify-admin";
import { getStatusMap } from "@/lib/admin/product-status";
import { DEFAULT_OPT_STATUS } from "@/lib/admin/opt-status";
import { activityForTarget } from "@/lib/admin/activity";
import {
  getFlowSentSet,
  listDraftsForProduct,
} from "@/lib/admin/media-review";
import { AdminNotConfigured } from "@/components/admin/AdminNotConfigured";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Tabs } from "@/components/ui/tabs";
import { formatPrice } from "@/lib/utils";
import { isAiConfigured } from "@/lib/ai/gemini";
import { EditForm } from "./edit-form";
import { MediaGallery } from "./media-gallery";
import { OptStatusSelect } from "./opt-status-select";
import { AiOptimizer } from "./ai-optimizer";
import { ImageWorkflow } from "./image-workflow";

export const metadata: Metadata = {
  title: "Product bewerken",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("nl-BE", {
  dateStyle: "short",
  timeStyle: "short",
});

export default async function ProductDetailPage({
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

  let product: Awaited<ReturnType<typeof getAdminProduct>> = null;
  let loadError: string | null = null;
  try {
    product = await getAdminProduct(id);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Onbekende fout.";
  }

  if (loadError) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink />
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Kon product niet laden uit Shopify: {loadError}
        </div>
      </div>
    );
  }

  if (!product) notFound();

  const [statusMap, logs, flowSent, drafts] = await Promise.all([
    getStatusMap([product.id]),
    activityForTarget(product.numericId, 20),
    getFlowSentSet(product.id),
    listDraftsForProduct(product.numericId),
  ]);
  const optStatus = statusMap.get(product.id) ?? DEFAULT_OPT_STATUS;

  const storeDomain = (
    process.env.SHOPIFY_SHOP_DOMAIN ?? process.env.SHOPIFY_STORE_DOMAIN
  )?.replace(/^https?:\/\//, "");

  const details = (
    <div className="flex flex-col gap-6">
      {/* Leesbare meta */}
      <div className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-1 text-sm">
        {product.unitCost ? <span>Inkoop: {formatPrice(product.unitCost)}</span> : null}
        <span>Prijs: <span className="text-foreground">{product.minPrice ? formatPrice(product.minPrice) : "—"}</span></span>
        {product.adviesprijs ? <span>Adviesprijs: {formatPrice(product.adviesprijs)}</span> : null}
        {product.marginPct != null ? <span>Marge: {product.marginPct}%</span> : null}
        <span>Voorraad: <span className="text-foreground">{product.totalInventory}</span></span>
        {product.sku ? <span>SKU: {product.sku}</span> : null}
        {product.vendor ? <span>Merk: {product.vendor}</span> : null}
        {product.productType ? <span>Type: {product.productType}</span> : null}
        {storeDomain ? (
          <a href={`https://${storeDomain}/products/${product.handle}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">
            Bekijk op de site ↗
          </a>
        ) : null}
      </div>

      <div className="flex items-center gap-3 text-sm">
        <span className="font-medium">Optimalisatie-status:</span>
        <OptStatusSelect numericId={product.numericId} current={optStatus} />
      </div>

      <div>
        <h2 className="mb-2 text-base font-medium">Foto&apos;s</h2>
        <MediaGallery numericId={product.numericId} media={product.media} />
      </div>

      <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="mb-4 text-base font-medium">Bewerken</h2>
        <EditForm
          numericId={product.numericId}
          title={product.title}
          descriptionHtml={product.descriptionHtml}
          tags={product.tags}
          seoTitle={product.seoTitle}
          seoDescription={product.seoDescription}
        />
      </div>

      <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="mb-1 text-base font-medium">AI-tekstoptimizer (Gemini)</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Genereer een concept, controleer het, en publiceer pas na jouw
          goedkeuring naar Shopify.
        </p>
        <AiOptimizer
          numericId={product.numericId}
          aiConfigured={isAiConfigured}
          original={{
            title: product.title,
            descriptionHtml: product.descriptionHtml,
            seoTitle: product.seoTitle,
            seoDescription: product.seoDescription,
            tags: product.tags,
          }}
        />
      </div>

      <div>
        <h2 className="mb-2 text-base font-medium">Activiteit</h2>
        {logs.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nog geen activiteit.</p>
        ) : (
          <ul className="flex flex-col gap-1.5 text-sm">
            {logs.map((l) => (
              <li key={l.id} className="flex gap-3">
                <span className="text-muted-foreground tabular-nums whitespace-nowrap">{dateFmt.format(new Date(l.createdAt))}</span>
                <span className={l.severity === "error" ? "text-destructive" : ""}>{l.message ?? l.action}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  const imageTab = (
    <ImageWorkflow
      numericId={product.numericId}
      shopifyProductGid={product.id}
      title={product.title}
      productType={product.productType}
      tags={product.tags}
      media={product.media}
      flowSent={[...flowSent]}
      drafts={drafts}
    />
  );

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <BackLink />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{product.title}</h1>
        <StatusBadge status={product.status} />
      </div>

      <Tabs
        tabs={[
          { label: "Productgegevens", content: details },
          { label: "Beelden verbeteren", content: imageTab },
        ]}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/admin/products" className="text-muted-foreground hover:text-foreground text-sm">
      ← Terug naar producten
    </Link>
  );
}
