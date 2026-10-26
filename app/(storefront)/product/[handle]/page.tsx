import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ProductView } from "@/components/ProductView";
import { QuickBenefits } from "@/components/QuickBenefits";
import { ProductTabs } from "@/components/ProductTabs";
import { BoughtTogether } from "@/components/BoughtTogether";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { NewsletterSection } from "@/components/NewsletterSection";
import {
  getProduct,
  getProductHandles,
  getProducts,
  productCategory,
} from "@/lib/products";
import { formatPrice } from "@/lib/utils";

type Params = { handle: string };

export async function generateStaticParams() {
  // Shopify onbereikbaar op build-tijd → niets pre-renderen; pagina's worden
  // dan on-demand gerenderd i.p.v. dat de hele build faalt.
  try {
    const handles = await getProductHandles();
    return handles.map((handle) => ({ handle }));
  } catch (err) {
    console.warn("generateStaticParams: Shopify niet bereikbaar, skip pre-render.", err);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) return { title: "Product niet gevonden" };

  return {
    title: product.title,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.title,
      description: product.description.slice(0, 160),
      images: product.featuredImage ? [product.featuredImage.url] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { handle } = await params;
  const product = await getProduct(handle);

  if (!product) notFound();

  // Cross-sell "Vaak samen gekocht": zelfde dier, anders zelfde merk/tag.
  const dier = product.tags
    .map((t) => t.toLowerCase())
    .find((t) => t === "hond" || t === "kat");
  const crossSell = (
    await getProducts({ category: dier ?? product.tags[0], first: 14 })
  )
    .filter((p) => p.handle !== product.handle)
    .slice(0, 10);

  const images =
    product.images.length > 0
      ? product.images
      : product.featuredImage
        ? [product.featuredImage]
        : [];

  const cat = product.productType
    ? productCategory(product.productType, product.title)
    : null;
  const dierLabel = dier === "hond" ? "Honden" : dier === "kat" ? "Katten" : null;
  const dierHref = dier ? `/producten?category=${dier}` : "/producten";
  const catHref = cat
    ? `/producten?${dier ? `category=${dier}&` : ""}type=${cat.key}`
    : null;
  const firstSku = product.variants[0]?.sku ?? null;

  return (
    <>
    <div className="mx-auto max-w-7xl px-4 pt-24 pb-16 sm:px-6 sm:pt-32 lg:px-8 lg:pt-36 lg:pb-24">
      {/* Kruimelpad */}
      <nav className="text-muted-foreground mb-4 flex flex-wrap items-center gap-1 text-xs sm:mb-8 sm:text-sm">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href={dierHref} className="hover:text-foreground">
          {dierLabel ?? "Producten"}
        </Link>
        {cat && catHref && (
          <>
            <ChevronRight className="size-3.5" />
            <Link href={catHref} className="hover:text-foreground">
              {cat.label}
            </Link>
          </>
        )}
        {/* Producttitel staat al in de h1; op mobiel niet herhalen */}
        <ChevronRight className="hidden size-3.5 sm:block" />
        <span className="text-foreground hidden sm:inline">{product.title}</span>
      </nav>

      <div className="space-y-12 sm:space-y-16 lg:space-y-20">
        {/* Hero */}
        <ProductView product={product} images={images} />

        {/* Quick benefits */}
        <QuickBenefits />

        {/* Tabs */}
        <ProductTabs
          product={product}
          sku={firstSku}
          editorialImage={
            dier === "hond"
              ? "/images/editorial-hond.jpg"
              : "/images/editorial-kat.jpg"
          }
        />

        {/* Carrousels */}
        <div className="space-y-10 sm:space-y-14">
          {/* Vaak samen gekocht */}
          <BoughtTogether products={crossSell} />

          {/* Recent bekeken */}
          <RecentlyViewed
            current={{
              handle: product.handle,
              title: product.title,
              image: product.featuredImage?.url ?? null,
              price: formatPrice(product.priceRange.minVariantPrice),
            }}
          />
        </div>
      </div>
    </div>

    {/* Nieuwsbrief — volledige breedte, blauw */}
    <NewsletterSection />
    </>
  );
}
