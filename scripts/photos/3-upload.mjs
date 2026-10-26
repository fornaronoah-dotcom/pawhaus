/**
 * Stap 3 — Schrijf de verbeterde foto's terug naar Shopify.
 * Per product: kleurtegel (positie 1) + witte versies, daarna oude media weg.
 * Variant→foto-koppelingen worden hersteld (o.a. Josera Crunchies).
 *
 * Zelfstandig. Draaien (vanuit projectroot):
 *   node --env-file=.env.local scripts/photos/3-upload.mjs --handles a,b
 *   node --env-file=.env.local scripts/photos/3-upload.mjs --handles a --dry-run
 *   node --env-file=.env.local scripts/photos/3-upload.mjs --revert a   (herstelt originelen)
 *
 * Back-up: vóór elke wijziging schrijft het script data/backup/<handle>.json.
 * De originele bytes staan al lokaal in data/originals/<handle>/.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, "data");
const BACKUP = join(DATA, "backup");
mkdirSync(BACKUP, { recursive: true });

const domain = (process.env.SHOPIFY_SHOP_DOMAIN ?? process.env.SHOPIFY_STORE_DOMAIN)?.replace(/^https?:\/\//, "");
const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const apiVersion = process.env.SHOPIFY_ADMIN_API_VERSION ?? "2025-01";
if (!domain || !token) { console.error("Ontbrekend: admin token/domein"); process.exit(1); }
const endpoint = `https://${domain}/admin/api/${apiVersion}/graphql.json`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- args ----
const argv = process.argv.slice(2);
const getFlag = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const has = (n) => argv.includes(n);
const dryRun = has("--dry-run");
const revertList = getFlag("--revert");
const handlesArg = getFlag("--handles");

async function gql(query, variables) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
      body: JSON.stringify({ query, variables }),
    });
    if (res.status === 429 && attempt < 6) { await sleep(2000); continue; }
    const json = await res.json();
    if (json.errors?.some((e) => e.extensions?.code === "THROTTLED") && attempt < 6) { await sleep(2500); continue; }
    if (json.errors?.length) throw new Error(JSON.stringify(json.errors));
    return json.data;
  }
}

const M_STAGED = `mutation($input:[StagedUploadInput!]!){ stagedUploadsCreate(input:$input){ stagedTargets{ url resourceUrl parameters{ name value } } userErrors{ message } } }`;
const M_CREATE = `mutation($productId:ID!,$media:[CreateMediaInput!]!){ productCreateMedia(productId:$productId,media:$media){ media{ ... on MediaImage { id } } mediaUserErrors{ message } } }`;
const Q_STATUS = `query($id:ID!){ product(id:$id){ media(first:100){ nodes{ ... on MediaImage { id status } } } } }`;
const Q_CURRENT = `query($id:ID!){ product(id:$id){ media(first:100){ nodes{ ... on MediaImage { id } } } } }`;
const M_VAPPEND = `mutation($productId:ID!,$variantMedia:[ProductVariantAppendMediaInput!]!){ productVariantAppendMedia(productId:$productId,variantMedia:$variantMedia){ userErrors{ message } } }`;
const M_DELETE = `mutation($productId:ID!,$mediaIds:[ID!]!){ productDeleteMedia(productId:$productId,mediaIds:$mediaIds){ deletedMediaIds mediaUserErrors{ message } } }`;

function mimeFor(p) { return p.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg"; }

/** Upload één lokaal bestand → mediaId op het product. */
async function uploadFile(productId, absPath, alt) {
  const filename = absPath.split("/").pop();
  const mime = mimeFor(absPath);
  const bytes = readFileSync(absPath);
  const staged = await gql(M_STAGED, { input: [{ filename, mimeType: mime, resource: "PRODUCT_IMAGE", httpMethod: "POST" }] });
  if (staged.stagedUploadsCreate.userErrors.length) throw new Error("staged: " + JSON.stringify(staged.stagedUploadsCreate.userErrors));
  const target = staged.stagedUploadsCreate.stagedTargets[0];
  const form = new FormData();
  for (const prm of target.parameters) form.append(prm.name, prm.value);
  form.append("file", new Blob([new Uint8Array(bytes)], { type: mime }), filename);
  const up = await fetch(target.url, { method: "POST", body: form });
  if (!up.ok) throw new Error(`storage upload ${up.status}: ${(await up.text().catch(() => "")).slice(0, 160)}`);
  const created = await gql(M_CREATE, { productId, media: [{ originalSource: target.resourceUrl, mediaContentType: "IMAGE", alt }] });
  if (created.productCreateMedia.mediaUserErrors.length) throw new Error("create: " + JSON.stringify(created.productCreateMedia.mediaUserErrors));
  const id = created.productCreateMedia.media[0]?.id;
  if (!id) throw new Error("geen media-id terug");
  return id;
}

async function waitReady(productId, ids, label) {
  const want = new Set(ids);
  for (let i = 0; i < 40; i++) {
    const data = await gql(Q_STATUS, { id: productId });
    const byId = Object.fromEntries(data.product.media.nodes.filter(Boolean).map((n) => [n.id, n.status]));
    const states = ids.map((id) => byId[id]);
    if (states.every((s) => s === "READY")) return;
    if (states.some((s) => s === "FAILED")) throw new Error(`media FAILED bij ${label}`);
    await sleep(1500);
  }
  throw new Error(`media niet READY binnen timeout bij ${label}`);
}

// ---------------- process één product (verbeteren) ----------------
async function processProduct(entry, product) {
  const { handle, productId } = { handle: entry.handle, productId: entry.productId };
  const newOrder = [entry.tile, ...entry.white.filter(Boolean)].filter(Boolean);
  console.log(`\n▶ ${handle} (${entry.colorName}) — ${newOrder.length} nieuwe foto's, ${entry.oldMediaIds.length} oude weg`);

  if (dryRun) { console.log("   [dry-run] zou uploaden:", newOrder); return; }

  // Huidige media LIVE ophalen (robuust tegen her-runs/reverts; niet de export-ids).
  const curData = await gql(Q_CURRENT, { id: productId });
  const oldIds = curData.product.media.nodes.filter(Boolean).map((n) => n.id);

  // Back-up vóór wijziging.
  writeFileSync(join(BACKUP, `${handle}.json`), JSON.stringify({
    handle, productId, oldMedia: product.media, oldIdsLive: oldIds, variants: product.variants, ranAt: new Date().toISOString(),
  }, null, 2));

  // 1. Upload nieuwe media in volgorde (tegel eerst).
  const newIds = [];
  for (const rel of newOrder) {
    const abs = join(__dirname, rel);
    const id = await uploadFile(productId, abs, product.title);
    newIds.push(id);
    process.stdout.write("   ↑ " + rel.split("/").slice(-2).join("/") + "\n");
  }
  await waitReady(productId, newIds, handle);

  // 2. Oude media verwijderen → nieuwe schuiven naar voren (tegel wordt hoofdfoto).
  const del = await gql(M_DELETE, { productId, mediaIds: oldIds });
  if (del.productDeleteMedia.mediaUserErrors.length) throw new Error("delete: " + JSON.stringify(del.productDeleteMedia.mediaUserErrors));

  // 3. Variant-herkoppeling — ENKEL bij echte multi-variant-producten (meer dan
  //    1 variant met een eigen foto). Single-variant erft automatisch de tegel.
  //    Moet ná het verwijderen, anders "variant already has attached media".
  const distinctIdx = new Set(entry.variantReassoc.map((r) => r.mediaIndex));
  if (entry.variantReassoc.length > 1 && distinctIdx.size > 1) {
    const vmedia = [];
    for (const r of entry.variantReassoc) {
      const newMediaId = newIds[1 + r.mediaIndex]; // +1 want tegel staat vooraan
      if (newMediaId) vmedia.push({ variantId: r.variantId, mediaIds: [newMediaId] });
    }
    if (vmedia.length) {
      const res = await gql(M_VAPPEND, { productId, variantMedia: vmedia });
      if (res.productVariantAppendMedia.userErrors.length) console.warn("   ! variant-koppeling:", JSON.stringify(res.productVariantAppendMedia.userErrors));
      else console.log(`   ↔ ${vmedia.length} variant-foto('s) gekoppeld`);
    }
  }
  console.log(`   ✓ klaar (${del.productDeleteMedia.deletedMediaIds.length} oude verwijderd)`);
}

// ---------------- revert één product (originelen terug) ----------------
async function revertProduct(handle, manifestById) {
  const bpath = join(BACKUP, `${handle}.json`);
  if (!existsSync(bpath)) { console.error(`! geen back-up voor ${handle}`); return; }
  const b = JSON.parse(readFileSync(bpath, "utf8"));
  const origDir = join(DATA, "originals", handle);
  const files = readdirSync(origDir).filter((f) => /^\d+\./.test(f)).sort((a, c) => parseInt(a) - parseInt(c));
  console.log(`\n↩ revert ${handle}: ${files.length} originelen terug`);
  if (dryRun) { console.log("   [dry-run]"); return; }

  // Huidige (verbeterde) media ophalen om straks te verwijderen.
  const cur = await gql(Q_STATUS, { id: b.productId });
  const curIds = cur.product.media.nodes.filter(Boolean).map((n) => n.id);

  // Originelen opnieuw uploaden in volgorde.
  const newIds = [];
  for (const f of files) {
    const id = await uploadFile(b.productId, join(origDir, f), handle);
    newIds.push(id);
    process.stdout.write("   ↑ " + f + "\n");
  }
  await waitReady(b.productId, newIds, handle);

  // Verbeterde media EERST verwijderen (anders "variant already has attached media").
  if (curIds.length) {
    const del = await gql(M_DELETE, { productId: b.productId, mediaIds: curIds });
    if (del.productDeleteMedia.mediaUserErrors.length) console.warn("   ! delete:", JSON.stringify(del.productDeleteMedia.mediaUserErrors));
  }

  // Variant-koppelingen herstellen op originele index (ná het verwijderen).
  const entry = manifestById[handle];
  const distinctIdx = new Set((entry?.variantReassoc ?? []).map((r) => r.mediaIndex));
  if ((entry?.variantReassoc?.length ?? 0) > 1 && distinctIdx.size > 1) {
    const vmedia = [];
    for (const r of entry.variantReassoc) {
      const id = newIds[r.mediaIndex];
      if (id) vmedia.push({ variantId: r.variantId, mediaIds: [id] });
    }
    if (vmedia.length) {
      const res = await gql(M_VAPPEND, { productId: b.productId, variantMedia: vmedia });
      if (res.productVariantAppendMedia.userErrors.length) console.warn("   ! variant-koppeling:", JSON.stringify(res.productVariantAppendMedia.userErrors));
    }
  }
  console.log("   ✓ teruggedraaid");
}

// ---------------- main ----------------
const manifest = JSON.parse(readFileSync(join(DATA, "manifest.json"), "utf8"));
const products = JSON.parse(readFileSync(join(DATA, "products.json"), "utf8"));
const manifestByHandle = Object.fromEntries(manifest.map((m) => [m.handle, m]));
const productByHandle = Object.fromEntries(products.map((p) => [p.handle, p]));

if (revertList) {
  for (const h of revertList.split(",").filter(Boolean)) await revertProduct(h.trim(), manifestByHandle);
  console.log("\nRevert klaar.");
} else {
  const handles = (handlesArg ? handlesArg.split(",") : manifest.map((m) => m.handle)).map((h) => h.trim()).filter(Boolean);
  console.log(`${dryRun ? "[DRY-RUN] " : ""}Verwerken: ${handles.length} product(en)`);
  let ok = 0, fail = 0;
  for (const h of handles) {
    const entry = manifestByHandle[h]; const product = productByHandle[h];
    if (!entry || !product) { console.error(`! onbekend handle: ${h}`); fail++; continue; }
    try { await processProduct(entry, product); ok++; }
    catch (e) { console.error(`! ${h} FOUT: ${e.message}`); fail++; }
  }
  console.log(`\nKlaar: ${ok} ok, ${fail} fout.`);
}
