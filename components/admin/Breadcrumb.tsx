import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

/**
 * Eenvoudige breadcrumb voor admin-detailpagina's. Het laatste item is de
 * huidige pagina (zonder link).
 */
export function Breadcrumb({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Kruimelpad"
      className={cn(
        "text-muted-foreground flex flex-wrap items-center gap-1 text-sm",
        className,
      )}
    >
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={`${item.label}-${i}`} className="flex items-center gap-1">
            {item.href && !last ? (
              <Link href={item.href} className="hover:text-foreground transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className={last ? "text-foreground font-medium" : ""}>
                {item.label}
              </span>
            )}
            {!last && <ChevronRight className="size-3.5 shrink-0 opacity-60" />}
          </span>
        );
      })}
    </nav>
  );
}
