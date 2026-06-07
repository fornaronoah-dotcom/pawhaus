import Link from "next/link";
import { Paw } from "@/components/Paw";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-4 px-4 py-24 text-center sm:py-32">
      <div className="relative">
        <span className="font-display text-7xl font-extrabold text-[#0C2A5A] sm:text-8xl">
          404
        </span>
        <Paw className="absolute -top-2 -right-7 size-9 -rotate-12 text-[#e0533f]" />
      </div>

      <h1 className="font-display text-3xl font-bold tracking-tight text-[#0C2A5A]">
        Oeps, deze pagina is zoek!
      </h1>
      <p className="max-w-sm text-sm text-[#0C2A5A]/70">
        De pagina die je zoekt bestaat niet (meer). Misschien is je beste maatje
        ermee weggelopen.
      </p>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-[#e0533f] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#cf4736]"
        >
          Terug naar home
        </Link>
        <Link
          href="/producten"
          className="inline-flex items-center gap-2 rounded-full border border-[#0C2A5A]/15 bg-white px-6 py-3 text-sm font-semibold text-[#0C2A5A] transition hover:border-[#0C2A5A]/30"
        >
          Bekijk alle producten
        </Link>
      </div>
    </div>
  );
}
