import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { fetchAdminProducts } from "@/lib/admin-products";
import { listBundles } from "@/lib/admin-bundles";
import { isAdminConfigured } from "@/lib/shopify-admin";
import { AdminNotConfigured } from "@/components/admin/AdminNotConfigured";
import { formatPrice } from "@/lib/utils";
import { BundleBuilder, type PickerProduct } from "./bundle-builder";

export const metadata: Metadata = {
  title: "Bundels",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function BundelsPage() {
  if (!isAdminConfigured) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">Bundels</h1>
        <AdminNotConfigured />
      </div>
    );
  }

  let products: PickerProduct[] = [];
  let bundles: Awaited<ReturnType<typeof listBundles>> = [];
  let error: string | null = null;
  try {
    const [all, existing] = await Promise.all([
      fetchAdminProducts({ max: 1000 }),
      listBundles(),
    ]);
    const bundleGids = new Set(existing.map((b) => b.id));
    products = all.items
      .filter((p) => !bundleGids.has(p.id)) // bundels zelf niet als component
      .map((p) => ({
        gid: p.id,
        numericId: p.numericId,
        title: p.title,
        image: p.image?.url ?? null,
        price: p.minPrice?.amount ?? null,
      }));
    bundles = existing;
  } catch (err) {
    error = err instanceof Error ? err.message : "Onbekende fout.";
  }

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bundels</h1>
        <p className="text-muted-foreground text-sm">
          Stel een bundel samen die als één product in Shopify verkoopt. Shopify
          beheert de voorraad van de onderdelen.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Kon gegevens niet laden: {error}
        </div>
      ) : (
        <>
          <BundleBuilder products={products} />

          <div>
            <h2 className="mb-2 text-base font-medium">Bestaande bundels</h2>
            {bundles.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nog geen bundels.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left">
                      <th className="w-12 px-2 py-2"></th>
                      <th className="px-3 py-2 font-medium">Titel</th>
                      <th className="px-3 py-2 font-medium">Prijs</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bundles.map((b) => (
                      <tr key={b.id} className="border-b last:border-0 hover:bg-muted/40">
                        <td className="px-2 py-2">
                          {b.image?.url ? (
                            <Image src={b.image.url} alt="" width={36} height={36} className="h-9 w-9 rounded object-cover ring-1 ring-foreground/10" />
                          ) : (
                            <div className="bg-muted h-9 w-9 rounded" />
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <Link href={`/admin/products/${b.numericId}`} className="font-medium hover:underline">
                            {b.title}
                          </Link>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {b.minPrice ? formatPrice(b.minPrice) : "—"}
                        </td>
                        <td className="px-3 py-2">{b.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
