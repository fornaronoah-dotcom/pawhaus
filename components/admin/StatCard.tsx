import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tone = "primary" | "sky" | "brand" | "teal";

const TONES: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  sky: "bg-sky/10 text-sky",
  brand: "bg-brand/15 text-brand-foreground",
  teal: "bg-teal/10 text-teal",
};

/**
 * Metric-tegel voor het dashboard: label, groot getal (font-baloo) en een
 * gekleurd icoon-pill. Hergebruikt de bestaande Card-primitief.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  tone?: Tone;
  className?: string;
}) {
  return (
    <Card className={cn("gap-0 p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-muted-foreground text-sm font-medium">{label}</p>
        {Icon && (
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              TONES[tone],
            )}
          >
            <Icon className="size-5" />
          </span>
        )}
      </div>
      <p className="font-baloo mt-2 text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
    </Card>
  );
}
