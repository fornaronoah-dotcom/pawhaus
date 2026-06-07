import { Fragment } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { BundleAddButton } from "@/components/BundleAddButton";
import { getProduct } from "@/lib/products";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";

/** Kortingspercentage dat op de som van de losse prijzen wordt toegepast. */
const BUNDLE_DISCOUNT = 0.15;

const BUNDLE_DEFS: { title: string; tagline: string; handles: string[] }[] = [
  {
    title: "Puppy startpakket",
    tagline: "Alles voor je nieuwe hond",
    handles: [
      "leren-halsband-hond",
      "gewatteerde-hondenriem",
      "natuurrubber-kauwspeelgoed",
    ],
  },
  {
    title: "Kitten comfortset",
    tagline: "Eten, slapen & verzorgen",
    handles: [
      "keramische-kattenvoerbak",
      "zelfreinigende-kattenbak",
      "wollen-kattenmand",
    ],
  },
  {
    title: "Luxe slaapduo",
    tagline: "Zacht slapen voor hond én kat",
    handles: ["orthopedische-hondenmand", "wollen-kattenmand"],
  },
];

export async function Bundles() {
  const bundles = await Promise.all(
    BUNDLE_DEFS.map(async (def) => {
      const resolved = await Promise.all(def.handles.map((h) => getProduct(h)));
      const products = resolved.filter((p): p is Product => Boolean(p));
      return { ...def, products };
    }),
  );

  return (
    <div className="mt-16 border-t border-[#0C2A5A]/10 pt-12">
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <h2 className="text-4xl font-bold tracking-tight">Voordeelbundels</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Slim samengesteld — samen{" "}
          <span className="font-semibold text-[#e0533f]">15% goedkoper</span>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {bundles.map((bundle) => {
          if (bundle.products.length === 0) return null;
          const currency =
            bundle.products[0].priceRange.minVariantPrice.currencyCode || "EUR";
          const money = (n: number) =>
            formatPrice({ amount: n.toFixed(2), currencyCode: currency });

          const total = bundle.products.reduce(
            (sum, p) => sum + Number(p.priceRange.minVariantPrice.amount),
            0,
          );
          const bundlePrice = total * (1 - BUNDLE_DISCOUNT);
          const variantIds = bundle.products
            .map((p) => p.variants[0]?.id)
            .filter((id): id is string => Boolean(id));

          return (
            <div
              key={bundle.title}
              className="relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="absolute top-4 right-4 rounded-full bg-[#e0533f] px-2.5 py-1 text-xs font-bold text-white">
                −{Math.round(BUNDLE_DISCOUNT * 100)}%
              </span>

              <h3 className="text-xl font-semibold text-[#0C2A5A]">
                {bundle.title}
              </h3>
              <p className="text-muted-foreground text-sm">{bundle.tagline}</p>

              {/* Productfoto's met + ertussen */}
              <div className="my-5 flex items-center justify-center gap-2">
                {bundle.products.map((p, i) => (
                  <Fragment key={p.id}>
                    <div className="bg-muted relative size-20 shrink-0 overflow-hidden rounded-xl ring-1 ring-black/5">
                      {p.featuredImage && (
                        <Image
                          src={p.featuredImage.url}
                          alt={p.featuredImage.altText ?? p.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                          unoptimized={p.featuredImage.url.endsWith(".svg")}
                        />
                      )}
                    </div>
                    {i < bundle.products.length - 1 && (
                      <Plus className="size-4 shrink-0 text-[#0C2A5A]/40" />
                    )}
                  </Fragment>
                ))}
              </div>

              {/* Wat zit erin */}
              <ul className="mb-5 space-y-1.5 text-sm">
                {bundle.products.map((p) => (
                  <li key={p.id} className="flex justify-between gap-3">
                    <span className="truncate text-[#0C2A5A]/80">{p.title}</span>
                    <span className="shrink-0 text-[#0C2A5A]/45">
                      {money(Number(p.priceRange.minVariantPrice.amount))}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[#0C2A5A]">
                    {money(bundlePrice)}
                  </span>
                  <span className="text-muted-foreground text-sm line-through">
                    {money(total)}
                  </span>
                </div>
                <p className="mb-3 text-sm font-medium text-[#e0533f]">
                  Je bespaart {money(total - bundlePrice)}
                </p>
                <BundleAddButton variantIds={variantIds} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
