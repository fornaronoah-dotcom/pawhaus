import "server-only";

import { Type } from "@google/genai";
import { gemini, GEMINI_MODEL } from "@/lib/ai/gemini";
import type { AdminProductDetail } from "@/lib/admin-products";

/** De velden die de AI als concept voorstelt (mappen op Shopify-velden). */
export type ProductTextProposal = {
  title: string;
  descriptionHtml: string;
  seoTitle: string;
  metaDescription: string;
  tags: string[];
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "Verbeterde producttitel, max ~70 tekens, geen merknaam-spam.",
    },
    descriptionHtml: {
      type: Type.STRING,
      description:
        "Herschreven beschrijving als veilige HTML, INGEDEELD IN SECTIES met <h3>-kopjes (deze worden uitklapmenu's op de site). Begin met 1 korte intro-paragraaf ZONDER kopje, gevolgd door 2-4 secties met een <h3>-kop, bv. <h3>Kenmerken</h3><ul><li>…</li></ul>, <h3>Gebruik</h3><p>…</p>, <h3>Voor wie</h3><p>…</p>. Alleen <p>, <h3>, <ul>, <li>, <strong>, <br> gebruiken.",
    },
    seoTitle: { type: Type.STRING, description: "SEO-titel, max 60 tekens." },
    metaDescription: {
      type: Type.STRING,
      description: "Meta-omschrijving, 140-160 tekens.",
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Max 12 relevante tags (lowercase).",
    },
  },
  required: ["title", "descriptionHtml", "seoTitle", "metaDescription", "tags"],
  propertyOrdering: ["title", "descriptionHtml", "seoTitle", "metaDescription", "tags"],
};

const SYSTEM_INSTRUCTION = `Je bent een ervaren e-commerce copywriter voor PAWHAUS, een Belgische webshop voor dierenbenodigdheden.
Schrijf altijd in vlot Nederlands (Vlaams register), warm, deskundig en betrouwbaar.
BELANGRIJK: verzin NOOIT details, materialen, afmetingen, prijzen of (medische) claims die niet uit de invoer blijken. Als iets onbekend is, laat het weg.
Geen overdreven superlatieven. Beschrijving in veilige HTML (alleen p, ul, li, strong, br). Houd SEO-titel ≤60 tekens en meta-omschrijving 140-160 tekens.`;

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildPrompt(p: AdminProductDetail): string {
  const input = {
    titel: p.title,
    producttype: p.productType || null,
    merk: p.vendor || null,
    huidige_beschrijving: stripHtml(p.descriptionHtml).slice(0, 1500) || null,
    huidige_tags: p.tags,
    prijs: p.minPrice ? `${p.minPrice.amount} ${p.minPrice.currencyCode}` : null,
  };
  return `Optimaliseer de productinhoud voor onderstaand product. Behoud feitelijke juistheid; verbeter taal, structuur en SEO.

Productgegevens (JSON):
${JSON.stringify(input, null, 2)}

Geef een verbeterde titel, beschrijving (HTML), SEO-titel, meta-omschrijving en tags.`;
}

/**
 * Genereert een AI-tekstvoorstel via Gemini met gestructureerde JSON-output.
 * Maakt enkel een concept — publiceren gebeurt elders, na goedkeuring.
 */
export async function generateProductTextProposal(
  p: AdminProductDetail,
): Promise<ProductTextProposal> {
  if (!gemini) throw new Error("GEMINI_API_KEY ontbreekt — AI niet geconfigureerd.");

  const res = await gemini.models.generateContent({
    model: GEMINI_MODEL,
    contents: buildPrompt(p),
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.7,
    },
  });

  const text = res.text;
  if (!text) throw new Error("Lege respons van Gemini.");

  let parsed: ProductTextProposal;
  try {
    parsed = JSON.parse(text) as ProductTextProposal;
  } catch {
    throw new Error("Kon AI-respons niet als JSON lezen.");
  }

  // Lichte validatie/normalisatie.
  return {
    title: String(parsed.title ?? "").trim(),
    descriptionHtml: String(parsed.descriptionHtml ?? "").trim(),
    seoTitle: String(parsed.seoTitle ?? "").trim(),
    metaDescription: String(parsed.metaDescription ?? "").trim(),
    tags: Array.isArray(parsed.tags)
      ? parsed.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 12)
      : [],
  };
}
