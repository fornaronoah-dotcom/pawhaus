"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Eenvoudige tabs. Alle panelen blijven gemount (verborgen via CSS) zodat
 * formulierstatus (bv. de rich text editor) bij wisselen behouden blijft.
 */
export function Tabs({
  tabs,
}: {
  tabs: { label: string; content: React.ReactNode }[];
}) {
  const [active, setActive] = useState(0);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 border-b">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setActive(i)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              i === active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div key={t.label} className={cn(i !== active && "hidden")}>
          {t.content}
        </div>
      ))}
    </div>
  );
}
