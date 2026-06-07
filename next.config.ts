import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vereist voor een lichte Docker-image (zie Dockerfile / DEPLOYMENT.md).
  output: "standalone",

  images: {
    // Cache geoptimaliseerde afbeeldingen minstens 24u (minder CPU op de VPS).
    minimumCacheTTL: 60 * 60 * 24,
    remotePatterns: [
      // Shopify product-afbeeldingen.
      { protocol: "https", hostname: "cdn.shopify.com" },
      // Placeholder-afbeeldingen voor mock-data zolang er geen Shopify-store is.
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
