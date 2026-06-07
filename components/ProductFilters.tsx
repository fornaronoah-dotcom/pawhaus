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
}: {
  activeCategory: string;
  activeSort: SortKey;
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
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-1 rounded-full bg-[#0C2A5A]/5 p-1">
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
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
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

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm">Sorteren:</span>
        <Select
          value={activeSort}
          onValueChange={(value) =>
            router.push(buildUrl({ sort: String(value ?? "featured") }))
          }
        >
          <SelectTrigger className="w-44" size="sm">
            <SelectValue />
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
