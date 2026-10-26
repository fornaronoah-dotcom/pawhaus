import { OPT_STATUS_LABELS } from "@/lib/admin/opt-status";
import type { OptStatus } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

/**
 * Gekleurde badge voor de AI/controle-status van een product, zodat de fase in
 * één oogopslag zichtbaar is (i.p.v. kale tekst).
 */
const TONES: Record<OptStatus, string> = {
  niet_gecontroleerd: "bg-muted text-muted-foreground",
  klaar_voor_ai: "bg-sky/15 text-sky",
  ai_voorstel_gemaakt: "bg-brand/20 text-brand-foreground",
  goedgekeurd: "bg-teal/15 text-teal",
  gepubliceerd: "bg-primary/10 text-primary",
};

export function OptStatusBadge({ status }: { status: OptStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        TONES[status],
      )}
    >
      {OPT_STATUS_LABELS[status]}
    </span>
  );
}
