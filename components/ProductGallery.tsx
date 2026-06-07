"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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

  // Hoofdfoto laten meeswitchen met de gekozen variant.
  useEffect(() => {
    if (!activeUrl) return;
    const i = images.findIndex((img) => sameImage(img.url, activeUrl));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (i >= 0) setActive(i);
  }, [activeUrl, images]);

  const current = images[active] ?? images[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-muted relative aspect-square overflow-hidden rounded-2xl">
        {current && (
          <Image
            src={current.url}
            alt={current.altText ?? title}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
            unoptimized={current.url.endsWith(".svg")}
          />
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-3">
          {images.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Afbeelding ${index + 1} tonen`}
              className={cn(
                "bg-muted relative aspect-square overflow-hidden rounded-lg ring-1 transition",
                index === active
                  ? "ring-foreground"
                  : "ring-transparent hover:ring-border",
              )}
            >
              <Image
                src={image.url}
                alt={image.altText ?? `${title} ${index + 1}`}
                fill
                sizes="20vw"
                className="object-cover"
                unoptimized={image.url.endsWith(".svg")}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
