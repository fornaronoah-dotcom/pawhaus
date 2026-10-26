/**
 * Client-veilige helpers die afgeleide product-info uit bestaande data halen
 * (geen Shopify-metafields nodig): dier uit tags, en inhoud/afmetingen/highlights
 * uit de (gesecteerde) beschrijving.
 */

function stripHtml(html: string): string {
  return (html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** "Hond" / "Kat" / null op basis van de Shopify-tags. */
export function dierFromTags(tags: string[]): string | null {
  const t = tags.map((x) => x.toLowerCase());
  if (t.includes("hond")) return "Hond";
  if (t.includes("kat")) return "Kat";
  return null;
}

/** Inhoud/gewicht uit de beschrijving, bv. "8 liter", "60 gr", "2,5 ltr". */
export function parseInhoud(descHtml: string): string | null {
  const s = stripHtml(descHtml);
  const m = s.match(
    /inhoud\s*:?\s*([0-9][\d.,]*\s*(?:gram|gr|kg|g|ml|liter|ltr|l|stuks|stuk|x)\b[^.,;<·|]{0,12})/i,
  );
  if (m) return m[1].trim().replace(/\s+/g, " ");
  return null;
}

/** Afmetingen uit de beschrijving, bv. "55,5 × 44 × 49,5 cm". */
export function parseAfmetingen(descHtml: string): string | null {
  const s = stripHtml(descHtml);
  const m3 = s.match(/(\d+[\d.,]*\s*[×xX]\s*\d+[\d.,]*\s*[×xX]\s*\d+[\d.,]*\s*cm)/);
  if (m3) return m3[1].replace(/[xX]/g, "×").replace(/\s+/g, " ");
  const m2 = s.match(/(\d+[\d.,]*\s*[×xX]\s*\d+[\d.,]*\s*cm)/);
  if (m2) return m2[1].replace(/[xX]/g, "×").replace(/\s+/g, " ");
  return null;
}

export type DescriptionSection = { title: string; html: string };

/**
 * Splitst een lange beschrijving op in losse secties o.b.v. de <h2>/<h3>-koppen.
 * Tekst vóór de eerste kop wordt de "Beschrijving"-sectie. Zonder koppen krijg
 * je één enkele "Beschrijving"-sectie met de volledige inhoud.
 */
export function splitDescriptionSections(descHtml: string): DescriptionSection[] {
  const html = (descHtml || "").trim();
  if (!html) return [];

  const headingRe = /<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi;
  const matches = [...html.matchAll(headingRe)];

  if (matches.length === 0) {
    return [{ title: "Beschrijving", html }];
  }

  const sections: DescriptionSection[] = [];

  // Inhoud vóór de eerste kop = intro.
  const intro = html.slice(0, matches[0].index).trim();
  if (stripHtml(intro)) {
    sections.push({ title: "Beschrijving", html: intro });
  }

  matches.forEach((m, i) => {
    const title = stripHtml(m[1]);
    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : html.length;
    const body = html.slice(start, end).trim();
    if (title && stripHtml(body)) {
      sections.push({ title, html: body });
    }
  });

  return sections.length > 0 ? sections : [{ title: "Beschrijving", html }];
}

/** Korte highlight-teksten uit de eerste <ul> van de beschrijving (max 4). */
export function highlightsFromDescription(descHtml: string, max = 3): string[] {
  const ul = (descHtml || "").match(/<ul>([\s\S]*?)<\/ul>/i);
  if (!ul) return [];
  const lis = [...ul[1].matchAll(/<li>([\s\S]*?)<\/li>/gi)];
  return lis
    .map((m) => stripHtml(m[1]))
    .filter(Boolean)
    .map((t) => (t.length > 44 ? t.slice(0, 43).replace(/\s+\S*$/, "") + "…" : t))
    .slice(0, max);
}
