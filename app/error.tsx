"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center">
      {/* subtiel pootafdruk-patroon op de achtergrond */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "url(/images/pootafdruk.png)",
          backgroundRepeat: "repeat",
          backgroundSize: "78px",
        }}
      />

      <div className="relative flex max-w-lg flex-col items-center gap-5">
        <Image
          src="/images/logo.png"
          alt="Pawhaus"
          width={240}
          height={80}
          priority
          className="h-auto w-48 sm:w-56"
        />

        <h1 className="font-display text-3xl font-bold tracking-tight text-[#0C2A5A]">
          Er ging iets mis
        </h1>
        <p className="max-w-sm text-sm text-[#0C2A5A]/70">
          Onze excuses, er is een onverwachte fout opgetreden. Probeer het
          opnieuw of ga terug naar de winkel.
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
    </div>
  );
}
