import type { OptStatus } from "@/lib/db/schema";

/**
 * Client-veilige constanten voor de optimalisatie-status (labels + default).
 * Géén server-only afhankelijkheden, zodat client-componenten ze mogen
 * importeren. De DB-logica staat in lib/admin/product-status.ts.
 */

export const OPT_STATUS_LABELS: Record<OptStatus, string> = {
  niet_gecontroleerd: "Niet gecontroleerd",
  klaar_voor_ai: "Klaar voor AI",
  ai_voorstel_gemaakt: "AI-voorstel gemaakt",
  goedgekeurd: "Goedgekeurd",
  gepubliceerd: "Gepubliceerd",
};

export const DEFAULT_OPT_STATUS: OptStatus = "niet_gecontroleerd";
