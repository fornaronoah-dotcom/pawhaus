/**
 * Client-veilige categorie-logica (geen server-only imports), zodat zowel de
 * storefront als het admin-paneel dezelfde "vriendelijke" subcategorieën delen.
 *
 * Bundelt de granulaire Shopify-`productType` in herkenbare groepen, bv.
 * "SNACKS KOEK" → Snacks, "KATTENBAK OPEN" → Kattenbakken. Regel-gebaseerd
 * zodat nieuwe producttypes automatisch in de juiste groep vallen.
 */
import type { ProductCategory } from "@/lib/types";

export const CATEGORY_RULES: {
  key: string;
  label: string;
  test: RegExp;
}[] = [
  { key: "snacks", label: "Snacks", test: /SNACK|KAUW|BEEN/ },
  { key: "voeding", label: "Voeding", test: /DROOGVOER|NATVOER|VOEDING|BROK/ },
  // Kattenbak(ken) + vulling MOET vóór de generieke /BAK/-regel staan,
  // anders pakt "Voer- & drinkbakken" per ongeluk "kattenBAK".
  { key: "kattenbak", label: "Kattenbakken", test: /KATTENBAK/ },
  { key: "krabpalen", label: "Krabpalen", test: /KRAB/ },
  { key: "bakken", label: "Voer- & drinkbakken", test: /BAK/ },
  { key: "manden", label: "Manden & kussens", test: /BED|MAND|KUSSEN|SLAAP/ },
  { key: "speelgoed", label: "Speelgoed", test: /SPEEL|DUMMY|BAL/ },
  { key: "verzorging", label: "Verzorging", test: /VERZORG|HYGI|VACHT|PADS|SHAMPOO|KAM|BORSTEL|NAGEL|SCHAAR/ },
];

/**
 * Vaste weergavevolgorde. Halsbanden + leibanden worden niet via productType
 * (die is "HALSBANDEN/LIJNEN…" voor beide) maar via de titel bepaald — daarom
 * staan ze hier expliciet, niet in CATEGORY_RULES.
 */
export const CATEGORY_ORDER = [
  ...CATEGORY_RULES.map((r) => r.key),
  "halsbanden",
  "leibanden",
  "accessoires",
];

export function productCategory(
  productType: string,
  title = "",
): ProductCategory {
  const t = (productType || "").toUpperCase();
  const n = (title || "").toLowerCase();

  // Halsbanden vs. leibanden: de Shopify-productType "HALSBANDEN/LIJNEN…"
  // bevat beide groepen, dus splitsen we op de titel.
  if (/HALSBAND|LIJN/.test(t) || /halsband|riem|leiband|rollijn|looplijn|tuig/.test(n)) {
    if (/halsband/.test(n)) return { key: "halsbanden", label: "Halsbanden" };
    if (/riem|leiband|rollijn|looplijn|\blijn\b|tuig|harnas/.test(n))
      return { key: "leibanden", label: "Leibanden" };
    return { key: "halsbanden", label: "Halsbanden" };
  }

  for (const rule of CATEGORY_RULES) {
    if (rule.test.test(t)) return { key: rule.key, label: rule.label };
  }
  return { key: "accessoires", label: "Accessoires" };
}
