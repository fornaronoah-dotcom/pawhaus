import "server-only";

import sharp from "sharp";

/**
 * Beeld-AI provider — swappable. Default: fal.ai (HTTP, pay-per-use) voor de
 * cutout/upscale, plus lokale sharp-compositie voor de witte productfoto.
 *
 * Vereist env `FAL_KEY`. Zonder die key degradeert het paneel netjes
 * (isImageAiConfigured = false).
 */

const FAL_KEY = process.env.FAL_KEY;

/** True wanneer fal.ai geconfigureerd is. */
export const isImageAiConfigured = Boolean(FAL_KEY);

export type ImageOp = "background" | "upscale" | "productshot";

export const IMAGE_OPS: { key: ImageOp; label: string; hint: string }[] = [
  {
    key: "background",
    label: "Achtergrond verwijderen",
    hint: "Knipt het product netjes uit (transparante achtergrond).",
  },
  {
    key: "upscale",
    label: "Scherper maken",
    hint: "Vergroot en verscherpt lage-resolutie leveranciersfoto's.",
  },
  {
    key: "productshot",
    label: "Productfoto",
    hint: "Échte product uitgeknipt op een zuiver witte achtergrond (geen hertekening).",
  },
];

type FalResult = { image?: { url?: string }; images?: { url?: string }[] };

const FAL_MODELS: Record<
  "background" | "upscale",
  {
    model: string;
    body: (url: string) => Record<string, unknown>;
    pick: (j: FalResult) => string | undefined;
  }
> = {
  // BiRefNet: hoogwaardige achtergrondverwijdering → transparante PNG (echte pixels).
  background: {
    model: "fal-ai/birefnet",
    body: (url) => ({ image_url: url }),
    pick: (j) => j?.image?.url,
  },
  // Real-ESRGAN: getrouwe upscale/verscherping (geen verzonnen details).
  upscale: {
    model: "fal-ai/esrgan",
    body: (url) => ({ image_url: url, scale: 2, model: "RealESRGAN_x4plus" }),
    pick: (j) => j?.image?.url,
  },
};

/** Roept een fal-model aan en geeft de resultaat-URL terug. */
async function runFal(op: "background" | "upscale", imageUrl: string): Promise<string> {
  const cfg = FAL_MODELS[op];
  const res = await fetch(`https://fal.run/${cfg.model}`, {
    method: "POST",
    headers: { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(cfg.body(imageUrl)),
  });
  if (!res.ok) {
    throw new Error(`fal.ai-fout (${res.status}): ${(await res.text()).slice(0, 300)}`);
  }
  const json = (await res.json()) as FalResult;
  const out = cfg.pick(json);
  if (!out) throw new Error("fal.ai gaf geen afbeelding terug.");
  return out;
}

async function fetchBytes(
  url: string,
): Promise<{ bytes: Buffer; contentType: string }> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Afbeelding ophalen mislukt (${r.status}).`);
  return {
    bytes: Buffer.from(await r.arrayBuffer()),
    contentType: r.headers.get("content-type") ?? "image/png",
  };
}

export type ImproveResult = { bytes: Buffer; contentType: string };

/**
 * Verbetert een afbeelding en geeft de resulterende bytes terug.
 * - background / upscale: via fal.ai (resultaat-URL → bytes).
 * - productshot: cutout via fal.ai birefnet → lokaal op een zuiver wit vierkant
 *   gecomposit met sharp (échte productpixels, niets hertekend).
 */
export async function improveImage(
  imageUrl: string,
  op: ImageOp,
): Promise<ImproveResult> {
  if (!FAL_KEY) throw new Error("FAL_KEY ontbreekt — fal.ai niet geconfigureerd.");

  if (op === "productshot") {
    const cutoutUrl = await runFal("background", imageUrl);
    const { bytes: cutout } = await fetchBytes(cutoutUrl);

    // Trim de transparante rand en plaats centraal op een wit vierkant.
    const trimmed = await sharp(cutout).trim().png().toBuffer();
    const meta = await sharp(trimmed).metadata();
    const longest = Math.max(meta.width ?? 1, meta.height ?? 1);
    const canvas = Math.max(1200, Math.round(longest / 0.82)); // 82% vulling, min. 1200px

    const jpeg = await sharp({
      create: {
        width: canvas,
        height: canvas,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([{ input: trimmed, gravity: "center" }])
      .jpeg({ quality: 92 })
      .toBuffer();

    return { bytes: jpeg, contentType: "image/jpeg" };
  }

  const url = await runFal(op, imageUrl);
  return fetchBytes(url);
}
