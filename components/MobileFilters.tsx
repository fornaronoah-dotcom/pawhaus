"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FilterSidebar } from "@/components/FilterSidebar";
import type { Facets } from "@/lib/types";

export function MobileFilters({ facets }: { facets: Facets }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-[#0C2A5A]/15 bg-white px-4 py-1.5 text-sm font-medium text-[#0C2A5A] lg:hidden"
      >
        <SlidersHorizontal className="size-4" />
        Filteren
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-80 overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="sr-only">Filteren</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-10">
            <FilterSidebar facets={facets} onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
