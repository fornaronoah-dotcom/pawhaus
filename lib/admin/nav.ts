/**
 * Navigatie-structuur van het admin-paneel (client-veilig — geen server
 * imports). Items met een `flag` worden via feature flags geactiveerd; items
 * zonder flag zijn altijd actief (al gebouwd).
 */

import {
  LayoutDashboard,
  Package,
  Sparkles,
  Boxes,
  Tag,
  Users,
  Mail,
  Gift,
  FileText,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

/** Sectiegroepen waarin nav-items in de sidebar worden gebundeld. */
export type NavGroup = "Overzicht" | "Catalogus" | "Groei" | "Systeem";

/** Volgorde waarin de groepen in de sidebar verschijnen. */
export const NAV_GROUPS: NavGroup[] = [
  "Overzicht",
  "Catalogus",
  "Groei",
  "Systeem",
];

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  group: NavGroup;
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
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, group: "Overzicht" },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, group: "Overzicht", flag: "analytics" },
  { href: "/admin/products", label: "Producten", icon: Package, group: "Catalogus" },
  { href: "/admin/ai-review", label: "AI-review", icon: Sparkles, group: "Catalogus" },
  { href: "/admin/bundels", label: "Bundels", icon: Boxes, group: "Catalogus", flag: "bundels" },
  { href: "/admin/kortingen", label: "Kortingen", icon: Tag, group: "Groei", flag: "kortingen" },
  { href: "/admin/klanten", label: "Klanten", icon: Users, group: "Groei", flag: "klanten" },
  { href: "/admin/marketing", label: "Marketing", icon: Mail, group: "Groei", flag: "marketing" },
  { href: "/admin/giveaways", label: "Giveaways", icon: Gift, group: "Groei", flag: "giveaways" },
  { href: "/admin/content", label: "Content", icon: FileText, group: "Groei", flag: "content" },
  { href: "/admin/instellingen", label: "Instellingen", icon: Settings, group: "Systeem" },
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
