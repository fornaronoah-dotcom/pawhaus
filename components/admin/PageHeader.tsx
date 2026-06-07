import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Herbruikbare pagina-kop voor het admin-paneel. Vervangt het overal
 * gekopieerde `<h1>` + muted `<p>` blok zodat alle pagina's dezelfde
 * typografie en uitlijning delen. Koppen gebruiken `font-baloo` voor
 * merkconsistentie met de storefront.
 */
export function PageHeader({
  title,
  description,
  badge,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  /** Klein label naast de titel, bv. een "binnenkort"-pill. */
  badge?: ReactNode;
  /** Rechts uitgelijnde acties (knoppen e.d.). */
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-baloo text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
