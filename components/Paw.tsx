import { cn } from "@/lib/utils";

/**
 * Pootafdruk die meekleurt met de tekstkleur (currentColor) via een CSS-masker.
 * Gebruik bv. <Paw className="size-5 text-white" />.
 */
export function Paw({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
  /** Genegeerd — alleen voor drop-in compatibiliteit met lucide-iconen. */
  strokeWidth?: number;
}) {
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0 bg-current", className)}
      style={{
        WebkitMaskImage: "url(/images/pootafdruk.png)",
        maskImage: "url(/images/pootafdruk.png)",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        ...style,
      }}
    />
  );
}
