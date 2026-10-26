"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type RecentItem = {
  handle: string;
  title: string;
  image: string | null;
  price: string;
};

const KEY = "pawhaus:recent";
const MAX = 12;

export function RecentlyViewed({ current }: { current: RecentItem }) {
  const [items, setItems] = useState<RecentItem[]>([]);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let prev: RecentItem[] = [];
    try {
      prev = JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {
      prev = [];
    }
    // Toon wat eerder bekeken is (zonder het huidige product).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(prev.filter((p) => p.handle !== current.handle).slice(0, MAX));
    // Huidige bovenaan opslaan (gededupliceerd).
    const next = [current, ...prev.filter((p) => p.handle !== current.handle)].slice(0, MAX);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* opslag vol of geblokkeerd — negeren */
    }
  }, [current]);

  function scroll(dir: 1 | -1) {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 600), behavior: "smooth" });
  }

  if (items.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4 sm:mb-6">
        <h2 className="font-poppins text-xl font-semibold tracking-tight sm:text-3xl">
          Recent bekeken
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Vorige"
            className="border-border hover:border-primary/50 hidden size-9 place-items-center rounded-full border transition hover:-translate-y-0.5 sm:grid"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Volgende"
            className="border-border hover:border-primary/50 hidden size-9 place-items-center rounded-full border transition hover:-translate-y-0.5 sm:grid"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div
        ref={scroller}
        className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:scroll-px-0 sm:gap-4 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((p) => (
          <Link
            key={p.handle}
            href={`/product/${p.handle}`}
            className="group w-[36vw] max-w-48 shrink-0 snap-start sm:w-48"
          >
            <div className="bg-secondary/30 relative aspect-square overflow-hidden rounded-2xl ring-1 ring-black/5">
              {p.image ? (
                <Image
                  src={p.image}
                  alt={p.title}
                  fill
                  sizes="200px"
                  className="object-contain p-3 transition-transform duration-500 group-hover:scale-105"
                  unoptimized={p.image.endsWith(".svg")}
                />
              ) : null}
            </div>
            <p className="group-hover:text-primary mt-2 line-clamp-1 text-sm font-medium transition-colors">
              {p.title}
            </p>
            <p className="text-muted-foreground text-sm">{p.price}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
