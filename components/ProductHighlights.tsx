import { Check } from "lucide-react";
import { highlightsFromDescription } from "@/lib/product-meta";

/**
 * Korte USP-chips onder de prijs, afgeleid uit de eerste opsomming in de
 * beschrijving. Toont niets als er geen highlights zijn.
 */
export function ProductHighlights({ descriptionHtml }: { descriptionHtml: string }) {
  const highlights = highlightsFromDescription(descriptionHtml, 3);
  if (highlights.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2">
      {highlights.map((h) => (
        <li
          key={h}
          className="bg-secondary/60 text-secondary-foreground flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
        >
          <Check className="text-teal size-3.5 shrink-0" />
          {h}
        </li>
      ))}
    </ul>
  );
}
