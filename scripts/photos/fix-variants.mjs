/**
 * Herstelt variant→foto-koppelingen voor multi-variant producten ná een revert.
 * Koppelt elke variant aan de HUIDIGE media op zijn originele index.
 *   node --env-file=.env.local scripts/photos/fix-variants.mjs h1,h2,...
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = dirname(fileURLToPath(import.meta.url));

const domain = (process.env.SHOPIFY_SHOP_DOMAIN ?? process.env.SHOPIFY_STORE_DOMAIN)?.replace(/^https?:\/\//, "");
const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const apiVersion = process.env.SHOPIFY_ADMIN_API_VERSION ?? "2025-01";
const ep = `https://${domain}/admin/api/${apiVersion}/graphql.json`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function gql(query, variables) {
  for (let a = 0; ; a++) {
    const res = await fetch(ep, { method: "POST", headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token }, body: JSON.stringify({ query, variables }) });
    if (res.status === 429 && a < 6) { await sleep(2000); continue; }
    const j = await res.json();
    if (j.errors?.some((e) => e.extensions?.code === "THROTTLED") && a < 6) { await sleep(2500); continue; }
    if (j.errors?.length) throw new Error(JSON.stringify(j.errors));
    return j.data;
  }
}
const Q = `query($id:ID!){ product(id:$id){ media(first:100){ nodes{ ... on MediaImage { id } } } } }`;
const M = `mutation($productId:ID!,$variantMedia:[ProductVariantAppendMediaInput!]!){ productVariantAppendMedia(productId:$productId,variantMedia:$variantMedia){ userErrors{ message } } }`;

const manifest = JSON.parse(readFileSync(join(__dirname, "data/manifest.json"), "utf8"));
const byHandle = Object.fromEntries(manifest.map((m) => [m.handle, m]));
const handles = (process.argv[2] || "").split(",").map((h) => h.trim()).filter(Boolean);

for (const h of handles) {
  const entry = byHandle[h];
  if (!entry) { console.error("! onbekend:", h); continue; }
  const cur = await gql(Q, { id: entry.productId });
  const mediaIds = cur.product.media.nodes.filter(Boolean).map((n) => n.id); // positievolgorde = originele index
  const vmedia = [];
  for (const r of entry.variantReassoc) {
    const id = mediaIds[r.mediaIndex];
    if (id) vmedia.push({ variantId: r.variantId, mediaIds: [id] });
  }
  if (!vmedia.length) { console.log(`– ${h}: niets te koppelen`); continue; }
  const res = await gql(M, { productId: entry.productId, variantMedia: vmedia });
  const errs = res.productVariantAppendMedia.userErrors;
  console.log(`${errs.length ? "!" : "✓"} ${h}: ${vmedia.length} variant(en) ${errs.length ? "FOUT " + JSON.stringify(errs) : "gekoppeld"}`);
}
console.log("Klaar.");
