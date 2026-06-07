import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Money, Product } from "@/lib/types";

/** Combineert class names en lost Tailwind-conflicten op. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatteert een Shopify-bedrag als prijs in nl-BE notatie (bv. € 39,95). */
export function formatPrice(money: Money): string {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: money.currencyCode || "EUR",
  }).format(Number(money.amount));
}

/** True wanneer de aanbiedingsprijs lager is dan de oorspronkelijke prijs. */
export function isOnSale(price: Money, compareAt: Money | null): boolean {
  return Boolean(compareAt && Number(compareAt.amount) > Number(price.amount));
}

/** Kortingspercentage (afgerond) tussen vergelijk- en verkoopprijs. */
export function discountPercent(price: Money, compareAt: Money): number {
  const from = Number(compareAt.amount);
  const to = Number(price.amount);
  if (from <= 0) return 0;
  return Math.round(((from - to) / from) * 100);
}

/** Stabiele hash van een string (voor deterministische mock-waarden). */
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Deterministisch "best verkocht"-vlag (≈30% van de producten). */
export function isBestseller(handle: string): boolean {
  return hashString(`${handle}::best`) % 10 < 3;
}

/** "Nieuw" wanneer het product de afgelopen ~30 dagen is bijgewerkt (proxy, geen createdAt). */
export function isNew(updatedAt: string, now = Date.now()): boolean {
  const t = Date.parse(updatedAt);
  if (Number.isNaN(t)) return false;
  return now - t < 30 * 24 * 60 * 60 * 1000;
}

/** Kleurnaam (NL) → hex voor swatches; keyword-gebaseerd met grijze fallback. */
const COLOR_RULES: [RegExp, string][] = [
  [/antracie?t/, "#2f3438"],
  [/lichtgrijs/, "#c7ccd1"],
  [/donkergrijs/, "#6b7178"],
  [/grijs|grey|gray|zilver/, "#9aa0a6"],
  [/zwart|black/, "#23272c"],
  [/wit|white|crème|creme|ivoor|naturel|natural/, "#f3efe7"],
  [/beige|zand|sand|taupe|khaki/, "#d8c4a2"],
  [/bruin|brown|choco|cognac|camel/, "#8a5a36"],
  [/roze|pink|rose|magenta/, "#e7a3bd"],
  [/bordeaux|wijnrood|rood|red/, "#c23b2f"],
  [/oranje|orange|terra/, "#e2802f"],
  [/geel|yellow|oker/, "#e8c349"],
  [/mint|olij?f|olive|groen|green/, "#5b9d6e"],
  [/navy|denim|petrol|blauw|blue|aqua|turquoise|teal/, "#4a7fb0"],
  [/paars|purple|lila|lavendel|violet/, "#8e6fbf"],
];

export function colorHex(name: string): string {
  const n = name.toLowerCase().trim();
  for (const [re, hex] of COLOR_RULES) if (re.test(n)) return hex;
  return "#b8bcc2";
}

/** Losse kleurwaarden van een product (optie "Color"/"Kleur"), gesplitst op "/". */
export function productColors(product: Product): string[] {
  const opt = product.options.find((o) =>
    ["color", "kleur"].includes(o.name.toLowerCase()),
  );
  if (!opt) return [];
  const out: string[] = [];
  for (const value of opt.values) {
    for (const part of value.split("/")) {
      const c = part.trim();
      if (c && !out.some((x) => x.toLowerCase() === c.toLowerCase())) out.push(c);
    }
  }
  return out;
}
