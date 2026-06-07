"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Paw } from "@/components/Paw";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-4 px-4 py-24 text-center sm:py-32">
      <div className="relative w-full max-w-sm">
        <Image
          src="/images/Move_the_animals_to_the_202606041807-removebg-preview.png"
          alt="Kat en hond spelen samen"
          width={672}
          height={384}
          priority
          className="h-auto w-full"
        />
        <Paw className="absolute -top-1 right-4 size-9 -rotate-12 text-[#e0533f]" />
      </div>

      <h1 className="font-display text-3xl font-bold tracking-tight text-[#0C2A5A]">
        Er ging iets mis
      </h1>
      <p className="max-w-sm text-sm text-[#0C2A5A]/70">
        Onze excuses, er is een onverwachte fout opgetreden. Probeer het opnieuw
        of ga terug naar de winkel.
      </p>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-full bg-[#e0533f] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#cf4736]"
        >
          Opnieuw proberen
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-[#0C2A5A]/15 bg-white px-6 py-3 text-sm font-semibold text-[#0C2A5A] transition hover:border-[#0C2A5A]/30"
        >
          Terug naar home
        </Link>
      </div>
    </div>
  );
}
