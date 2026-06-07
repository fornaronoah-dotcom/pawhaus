import type { MetadataRoute } from "next";
import { getProductHandles } from "@/lib/products";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/producten",
    "/over-ons",
    "/contact",
    "/verzending-retour",
    "/privacy",
    "/algemene-voorwaarden",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
  }));

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const handles = await getProductHandles();
    productRoutes = handles.map((handle) => ({
      url: `${baseUrl}/product/${handle}`,
      lastModified: new Date(),
    }));
  } catch {
    // Bij een fout (bv. Shopify onbereikbaar) leveren we enkel de statische routes.
  }

  return [...staticRoutes, ...productRoutes];
}
