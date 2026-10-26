/**
 * Stap 1 — Exporteer alle producten met hun media + variant-media uit Shopify.
 * Zelfstandig (geen server-only imports), draaien met:
 *   node --env-file=.env.local scripts/photos/1-export.mjs
 * Output: scripts/photos/data/products.json
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, "data");
mkdirSync(DATA, { recursive: true });

const domain = (
  process.env.SHOPIFY_SHOP_DOMAIN ?? process.env.SHOPIFY_STORE_DOMAIN
)?.replace(/^https?:\/\//, "");
const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const apiVersion = process.env.SHOPIFY_ADMIN_API_VERSION ?? "2025-01";
if (!domain || !token) {
  console.error("Ontbrekend: SHOPIFY_ADMIN_ACCESS_TOKEN en/of SHOPIFY_SHOP_DOMAIN/STORE_DOMAIN");
  process.exit(1);
}
const endpoint = `https://${domain}/admin/api/${apiVersion}/graphql.json`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gql(query, variables) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
      body: JSON.stringify({ query, variables }),
    });
    if (res.status === 429 && attempt < 5) { await sleep(1500); continue; }
    const json = await res.json();
    if (json.errors?.some((e) => e.extensions?.code === "THROTTLED") && attempt < 5) {
      await sleep(2000); continue;
    }
    if (json.errors?.length) throw new Error(JSON.stringify(json.errors));
    return json.data;
  }
}

const QUERY = `
  query Export($first:Int!, $after:String) {
    products(first:$first, after:$after) {
      edges { cursor node {
        id handle title status tags productType
        media(first:50) { edges { node {
          ... on MediaImage { id alt image { url width height } }
        }}}
        variants(first:100) { edges { node {
          id title
          media(first:5) { edges { node { ... on MediaImage { id image { url } } } } }
        }}}
      }}
      pageInfo { hasNextPage }
    }
  }`;

const out = [];
let after = null;
for (;;) {
  const data = await gql(QUERY, { first: 25, after });
  const conn = data.products;
  for (const { node } of conn.edges) {
    const media = node.media.edges
      .map((e) => e.node)
      .filter((m) => m && m.id && m.image?.url)
      .map((m) => ({ id: m.id, url: m.image.url, width: m.image.width, height: m.image.height, alt: m.alt ?? "" }));
    const variants = node.variants.edges.map((e) => e.node).map((v) => ({
      id: v.id,
      title: v.title,
      mediaIds: v.media.edges.map((me) => me.node?.id).filter(Boolean),
    }));
    out.push({
      id: node.id,
      numericId: node.id.split("/").pop(),
      handle: node.handle,
      title: node.title,
      status: node.status,
      tags: node.tags,
      productType: node.productType,
      media,
      variants,
    });
    after = conn.edges[conn.edges.length - 1].cursor;
  }
  if (!conn.pageInfo.hasNextPage) break;
}

writeFileSync(join(DATA, "products.json"), JSON.stringify(out, null, 2));
const active = out.filter((p) => p.status === "ACTIVE");
const withVar = out.filter((p) => p.variants.some((v) => v.mediaIds.length));
console.log(`Geëxporteerd: ${out.length} producten (${active.length} ACTIVE).`);
console.log(`Met variant-media-koppelingen: ${withVar.length} → ${withVar.map((p) => p.handle).join(", ") || "geen"}`);
console.log(`Totaal media-items: ${out.reduce((n, p) => n + p.media.length, 0)}`);
console.log(`→ ${join(DATA, "products.json")}`);
