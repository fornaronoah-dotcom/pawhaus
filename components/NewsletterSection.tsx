import Image from "next/image";
import { Newsletter } from "@/components/Newsletter";
import { WaveEdge } from "@/components/WaveEdge";

/**
 * Nieuwsbrief-band over de volledige breedte in het site-blauw (sky-tint),
 * zelfde stijl als de homepage. Geen kader/afgeronde box.
 */
export function NewsletterSection() {
  return (
    <section className="bg-sky-tint text-sky-tint-foreground relative">
      <WaveEdge position="top" />
      <WaveEdge position="bottom" />
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-14 text-center sm:px-6 lg:flex-row lg:gap-8 lg:px-8 lg:py-16 lg:text-left">
        <Image
          src="/images/newsletter-pets-v2.png"
          alt="Hond en kat met speelgoed"
          width={2203}
          height={1381}
          className="h-auto w-44 shrink-0 sm:w-60 lg:w-72"
        />
        <div className="flex-1">
          <h2 className="flex items-center justify-center gap-2 text-[1.7rem] font-bold tracking-tight text-[#0C2A5A] sm:text-3xl lg:justify-start lg:text-4xl">
            Blijf op de hoogte!
            <Image
              src="/images/heart.png"
              alt=""
              width={102}
              height={116}
              className="h-[0.9em] w-auto"
            />
          </h2>
          <p className="mt-1.5 text-sm text-[#243B63] lg:text-base">
            Ontvang tips, nieuwe producten en exclusieve kortingen rechtstreeks in
            je mailbox.
          </p>
        </div>
        <Newsletter className="lg:w-[28rem]" />
      </div>
    </section>
  );
}
