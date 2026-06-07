import { cn } from "@/lib/utils";

/** Handgetekende golf, hergebruikt van de hero-overgang. */
const WAVE_PATH =
  "M0,66 C90,50 170,74 250,64 C340,53 410,80 520,68 C620,57 690,84 800,70 C910,56 980,82 1090,68 C1190,55 1270,80 1360,66 C1400,60 1424,70 1440,64 L1440,120 L0,120 Z";

/**
 * Golvende sectie-overgang. Plaats absoluut op de rand van een gekleurde band;
 * `color` is de kleur van de aangrenzende sectie (standaard wit), zodat de golf
 * naadloos in de buur-sectie overloopt.
 */
export function WaveEdge({
  position = "bottom",
  color = "#ffffff",
  className,
}: {
  position?: "top" | "bottom";
  color?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 z-0 block h-10 w-full lg:h-14",
        position === "bottom" ? "bottom-0" : "top-0 -scale-y-100",
        className,
      )}
    >
      <path fill={color} d={WAVE_PATH} />
    </svg>
  );
}
