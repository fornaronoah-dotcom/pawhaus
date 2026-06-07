import { Newsletter } from "@/components/Newsletter";

/** Premium nieuwsbrief-blok: zachte container, kop + de bestaande Newsletter-form. */
export function NewsletterSection() {
  return (
    <section className="from-brand/15 to-accent/50 relative overflow-hidden rounded-[32px] bg-gradient-to-br px-6 py-12 sm:px-12 sm:py-14">
      {/* Speelse decoratie */}
      <span className="pointer-events-none absolute -top-8 -right-8 text-[9rem] opacity-20 select-none">
        🐾
      </span>
      <div className="relative max-w-xl">
        <h2 className="font-poppins text-3xl font-semibold tracking-tight sm:text-4xl">
          Blijf op de hoogte <span className="text-primary">❤</span>
        </h2>
        <p className="text-muted-foreground mt-3 text-sm sm:text-base">
          Schrijf je in en ontvang exclusieve tips, kortingen en nieuwe producten —
          speciaal voor jou en je huisdier.
        </p>
        <Newsletter className="mt-6 max-w-md" />
      </div>
    </section>
  );
}
