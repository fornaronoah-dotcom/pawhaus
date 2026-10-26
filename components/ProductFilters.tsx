"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { SORT_OPTIONS, type SortKey } from "@/lib/types";

const CATEGORIES = [
  { value: "", label: "Alles" },
  { value: "hond", label: "Honden" },
  { value: "kat", label: "Katten" },
];

export function ProductFilters({
  activeCategory,
  activeSort,
  leading,
}: {
  activeCategory: string;
  activeSort: SortKey;
  /** Optioneel element links van het sorteren (bv. de mobiele filterknop). */
  leading?: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function buildUrl(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const query = params.toString();
    return query ? `/producten?${query}` : "/producten";
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
      <div className="flex w-full items-center gap-1 rounded-full bg-[#0C2A5A]/5 p-1 sm:w-auto">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.value;
          return (
            <button
              key={cat.value || "all"}
              type="button"
              onClick={() =>
                router.push(buildUrl({ category: cat.value, type: "" }))
              }
              className={cn(
                "flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors sm:flex-none sm:py-1.5",
                isActive
                  ? "bg-[#e0533f] text-white shadow-sm"
                  : "text-[#0C2A5A]/70 hover:text-[#0C2A5A]",
              )}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2">
        {leading}
        <span className="text-muted-foreground ml-auto hidden text-sm sm:inline">
          Sorteren:
        </span>
        <Select
          value={activeSort}
          onValueChange={(value) =>
            router.push(buildUrl({ sort: String(value ?? "featured") }))
          }
        >
          <SelectTrigger className="w-44" size="sm" aria-label="Sorteren">
            <SelectValue>
              {(value: SortKey) =>
                SORT_OPTIONS.find((o) => o.value === value)?.label ?? value
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
