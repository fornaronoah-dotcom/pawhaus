"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import Image from "next/image";

/**
 * Thumbnail die op klik in het groot (lightbox) opent. Sluiten via klik,
 * de ×-knop of Esc. Herbruikbaar in het admin-paneel.
 */
export function ZoomableImage({
  src,
  alt = "",
  width = 96,
  height = 96,
  className,
}: {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block cursor-zoom-in"
        title="Klik om groot te bekijken"
      >
        <Image src={src} alt={alt} width={width} height={height} className={className} />
      </button>
      {open ? (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/80 p-6"
          role="dialog"
          aria-modal="true"
        >
          <img
            src={src}
            alt={alt}
            className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
          />
          <button
            type="button"
            aria-label="Sluiten"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-5 text-3xl leading-none text-white/80 hover:text-white"
          >
            ×
          </button>
        </div>
      ) : null}
    </>
  );
}
