/**
 * Navigatie-structuur van het admin-paneel (client-veilig — geen server
 * imports). Items met een `flag` worden via feature flags geactiveerd; items
 * zonder flag zijn altijd actief (al gebouwd).
 */

export type NavItem = {
  href: string;
  label: string;
  /** Feature-flag key; ontbreekt = altijd actief. */
  flag?: FeatureKey;
};

export type FeatureKey =
  | "bundels"
  | "kortingen"
  | "klanten"
  | "marketing"
  | "giveaways"
  | "content"
  | "analytics";

export const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Producten" },
  { href: "/admin/ai-review", label: "AI-review" },
  { href: "/admin/bundels", label: "Bundels", flag: "bundels" },
  { href: "/admin/kortingen", label: "Kortingen", flag: "kortingen" },
  { href: "/admin/klanten", label: "Klanten", flag: "klanten" },
  { href: "/admin/marketing", label: "Marketing", flag: "marketing" },
  { href: "/admin/giveaways", label: "Giveaways", flag: "giveaways" },
  { href: "/admin/content", label: "Content", flag: "content" },
  { href: "/admin/analytics", label: "Analytics", flag: "analytics" },
  { href: "/admin/instellingen", label: "Instellingen" },
];

/** Module-metadata voor placeholderpagina's + instellingen. */
export const MODULES: Record<
  FeatureKey,
  { label: string; description: string; planned: string[] }
> = {
  bundels: {
    label: "Bundels",
    description: "Stel productbundels samen die als één Shopify-product verkopen.",
    planned: ["Bundel-builder", "Producten slepen", "Korting", "Preview", "Publiceren naar Shopify"],
  },
  kortingen: {
    label: "Kortingscodes",
    description: "Maak en beheer kortingscodes rechtstreeks in Shopify.",
    planned: ["Percentage / vast bedrag", "Vervaldatum", "Gebruikslimiet", "QR-generatie"],
  },
  klanten: {
    label: "Klanten (CRM)",
    description: "Bekijk en segmenteer je Shopify-klanten.",
    planned: ["Klantenoverzicht", "Segmentatie", "Export", "Aankoophistoriek"],
  },
  marketing: {
    label: "Marketing & e-mail",
    description: "Nieuwsbrief-inschrijvingen, segmenten en campagnes.",
    planned: ["Nieuwsbrief-opt-in", "Segmenten", "Templates", "Campagnes"],
  },
  giveaways: {
    label: "Giveaways",
    description: "Organiseer winacties: deelnameformulier en willekeurige winnaar.",
    planned: ["Deelnameformulier", "Inschrijvingen", "Winnaar trekken"],
  },
  content: {
    label: "Content",
    description: "Beheer pagina's, blog en site-content.",
    planned: ["Pagina's", "Blog", "Banners"],
  },
  analytics: {
    label: "Analytics",
    description: "Omzet, funnels, herhaalaankopen en conversie.",
    planned: ["Omzet-dashboard", "Funnels", "Herhaalaankopen", "Conversie"],
  },
};
