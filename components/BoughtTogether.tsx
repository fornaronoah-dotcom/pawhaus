"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/types";

export function BoughtTogether({
  products,
  title = "Vaak samen gekocht",
  bundleHint = false,
}: {
  products: Product[];
  title?: string;
  bundleHint?: boolean;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  function scroll(dir: 1 | -1) {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 600), behavior: "smooth" });
  }

  if (products.length === 0) return null;

  return (
    <section>
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="font-poppins text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <Link
            href="/producten"
            className="text-primary mr-2 text-sm font-medium hover:underline"
          >
            Bekijk alles
          </Link>
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Vorige"
            className="border-border hover:border-primary/50 grid size-9 place-items-center rounded-full border transition hover:-translate-y-0.5"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Volgende"
            className="border-border hover:border-primary/50 grid size-9 place-items-center rounded-full border transition hover:-translate-y-0.5"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div
        ref={scroller}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {bundleHint && (
          <div className="from-primary/10 to-accent/60 flex w-56 shrink-0 snap-start flex-col justify-center rounded-2xl bg-gradient-to-br p-5 ring-1 ring-black/5">
            <span className="bg-primary text-primary-foreground inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold">
              <Sparkles className="size-3" /> Bespaar 10%
            </span>
            <p className="font-poppins mt-3 text-lg leading-snug font-semibold">
              Combineer & bespaar
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Stel een setje samen met de producten hiernaast.
            </p>
          </div>
        )}
        {products.map((p, i) => (
          <div key={p.handle} className="w-44 shrink-0 snap-start sm:w-56">
            <ProductCard product={p} index={i} />
          </div>
        ))}
      </div>
    </section>
  );
}
