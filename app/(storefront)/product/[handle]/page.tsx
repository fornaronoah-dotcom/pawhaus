import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ProductView } from "@/components/ProductView";
import { ProductGrid } from "@/components/ProductGrid";
import { getProduct, getProductHandles, getProducts } from "@/lib/products";

type Params = { handle: string };

export async function generateStaticParams() {
  const handles = await getProductHandles();
  return handles.map((handle) => ({ handle }));
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

  const category = product.tags[0];
  const related = (await getProducts({ category, first: 5 }))
    .filter((p) => p.handle !== product.handle)
    .slice(0, 4);

  // Cross-sell "Vaak samen gekocht": producten voor hetzelfde dier (hond/kat).
  const dier = product.tags
    .map((t) => t.toLowerCase())
    .find((t) => t === "hond" || t === "kat");
  const exclude = new Set([product.handle, ...related.map((r) => r.handle)]);
  const crossSell = dier
    ? (await getProducts({ category: dier, first: 10 }))
        .filter((p) => !exclude.has(p.handle))
        .slice(0, 4)
    : [];

  const images =
    product.images.length > 0
      ? product.images
      : product.featuredImage
        ? [product.featuredImage]
        : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-28 sm:px-6 lg:px-8 lg:pb-8">
      {/* Kruimelpad */}
      <nav className="text-muted-foreground mb-6 flex items-center gap-1 text-sm">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href="/producten" className="hover:text-foreground">
          Producten
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{product.title}</span>
      </nav>

      <ProductView product={product} images={images} />

      {crossSell.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-8 text-4xl font-bold tracking-tight">
            Vaak samen gekocht
          </h2>
          <ProductGrid products={crossSell} />
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-8 text-4xl font-bold tracking-tight">
            Misschien ook interessant
          </h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
