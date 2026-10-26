"use client";

import { useEffect, useRef, useState } from "react";
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
  const swiper = useRef<HTMLDivElement>(null);

  // Hoofdfoto laten meeswitchen met de gekozen variant.
  useEffect(() => {
    if (!activeUrl) return;
    const i = images.findIndex((img) => sameImage(img.url, activeUrl));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (i >= 0) setActive(i);
  }, [activeUrl, images]);

  // Mobiele swipe-galerij volgt de actieve foto (variant/thumbnail-klik).
  useEffect(() => {
    const el = swiper.current;
    if (!el || el.clientWidth === 0) return;
    const target = active * el.clientWidth;
    if (Math.abs(el.scrollLeft - target) > 2) {
      el.scrollTo({ left: target, behavior: "smooth" });
    }
  }, [active]);

  // Pas na het uitrollen de actieve foto bepalen; anders kaapt een
  // tussenpositie van een smooth-scroll (bolletje-klik) de selectie.
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  function onSwipe() {
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      const el = swiper.current;
      if (!el || el.clientWidth === 0) return;
      setActive(Math.round(el.scrollLeft / el.clientWidth));
    }, 100);
  }
  useEffect(() => () => {
    if (settle.current) clearTimeout(settle.current);
  }, []);

  const current = images[active] ?? images[0];

  return (
    <div className="flex flex-col-reverse gap-3 sm:gap-4 lg:flex-row">
      {/* Thumbnails: alleen vanaf sm (mobiel swipet + bolletjes), verticaal op desktop */}
      {images.length > 1 && (
        <div className="hidden gap-3 overflow-x-auto [scrollbar-width:none] sm:flex lg:flex-col lg:overflow-visible [&::-webkit-scrollbar]:hidden">
          {images.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Afbeelding ${index + 1} tonen`}
              className={cn(
                "relative aspect-square size-16 shrink-0 overflow-hidden rounded-2xl transition-all duration-200 lg:size-20",
                index === active ? "opacity-100" : "opacity-50 hover:opacity-100",
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

      {/* Mobiel: horizontaal swipen tussen foto's */}
      <div className="sm:hidden">
        <div
          ref={swiper}
          onScroll={onSwipe}
          className="-mx-4 flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((image, index) => (
            <div
              key={`${image.url}-${index}`}
              className="relative aspect-square w-full shrink-0 snap-center px-4"
            >
              <div className="relative size-full overflow-hidden rounded-3xl">
                <Image
                  src={image.url}
                  alt={image.altText ?? `${title} ${index + 1}`}
                  fill
                  priority={index === 0}
                  // Zelfde sizes als de desktop-hoofdfoto → één preload-URL.
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-contain p-4"
                  unoptimized={image.url.endsWith(".svg")}
                />
              </div>
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5">
            {images.map((image, index) => (
              <button
                key={`${image.url}-dot-${index}`}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Afbeelding ${index + 1} tonen`}
                className="grid h-6 place-items-center px-0.5"
              >
                <span
                  className={cn(
                    "block h-1.5 rounded-full transition-all duration-200",
                    index === active ? "bg-primary w-5" : "w-1.5 bg-[#0C2A5A]/20",
                  )}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hoofdfoto (vanaf sm) */}
      <div
        className="group relative hidden aspect-square flex-1 cursor-zoom-in overflow-hidden rounded-[32px] sm:block"
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
