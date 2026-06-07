"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/lib/types";

/** Vergelijkt afbeeldings-URL's los van de ?v=-queryparameter. */
function sameImage(a: string, b: string) {
  return a.split("?")[0] === b.split("?")[0];
}

export function ProductGallery({
  images,
  title,
  activeUrl,
}: {
  images: ProductImage[];
  title: string;
  /** Toon de hoofdfoto die bij de gekozen variant hoort. */
  activeUrl?: string | null;
}) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);

  // Hoofdfoto laten meeswitchen met de gekozen variant.
  useEffect(() => {
    if (!activeUrl) return;
    const i = images.findIndex((img) => sameImage(img.url, activeUrl));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (i >= 0) setActive(i);
  }, [activeUrl, images]);

  const current = images[active] ?? images[0];

  return (
    <div className="flex flex-col-reverse gap-4 lg:flex-row">
      {/* Thumbnails: horizontaal op mobiel, verticaal op desktop */}
      {images.length > 1 && (
        <div className="flex gap-3 lg:flex-col">
          {images.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Afbeelding ${index + 1} tonen`}
              className={cn(
                "bg-secondary/40 relative aspect-square size-16 shrink-0 overflow-hidden rounded-2xl ring-1 transition-all duration-200 lg:size-20",
                index === active
                  ? "ring-primary ring-2"
                  : "ring-black/5 hover:ring-foreground/20",
              )}
            >
              <Image
                src={image.url}
                alt={image.altText ?? `${title} ${index + 1}`}
                fill
                sizes="80px"
                className="object-cover"
                unoptimized={image.url.endsWith(".svg")}
              />
            </button>
          ))}
        </div>
      )}

      {/* Hoofdfoto */}
      <div
        className="group bg-secondary/30 relative aspect-square flex-1 cursor-zoom-in overflow-hidden rounded-[32px]"
        onClick={() => setZoom((z) => !z)}
      >
        <AnimatePresence mode="wait">
          {current && (
            <motion.div
              key={current.url}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <Image
                src={current.url}
                alt={current.altText ?? title}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className={cn(
                  "object-contain p-6 transition-transform duration-500 ease-out",
                  zoom ? "scale-150" : "group-hover:scale-105",
                )}
                unoptimized={current.url.endsWith(".svg")}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <span className="text-foreground/70 absolute right-4 bottom-4 grid size-9 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition group-hover:scale-105">
          <ZoomIn className="size-4" />
        </span>
      </div>
    </div>
  );
}
