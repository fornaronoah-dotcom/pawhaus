"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/lib/types";

export function ProductGallery({
  images,
  title,
}: {
  images: ProductImage[];
  title: string;
}) {
  const [active, setActive] = useState(0);
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
