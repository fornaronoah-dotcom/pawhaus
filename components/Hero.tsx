import Image from "next/image";
import Link from "next/link";
import { MapPin, ShieldCheck, Star, Truck } from "lucide-react";
import { Paw } from "@/components/Paw";

/** Handgetekende pijl die naar links-onder wijst (naar de CTA). */
function ArrowDoodle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 50"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M94 12 C66 6 26 12 13 37" />
      <path d="M13 37 l17 -3" />
      <path d="M13 37 l6 -16" />
    </svg>
  );
}

/* Vertrouwenssignalen in lijnstijl onder de tagline. */
const FEATURES: {
  Icon: typeof Truck;
  title: string;
  sub: React.ReactNode;
}[] = [
  {
    Icon: Truck,
    title: "Gratis verzending",
    sub: (
      <>
        Vanaf <span className="text-[#e0533f]">€70</span>
      </>
    ),
  },
  { Icon: Star, title: "4,8/5 sterren", sub: "Klanttevredenheid" },
  { Icon: ShieldCheck, title: "Veilig betalen", sub: "100% beveiligd" },
  { Icon: MapPin, title: "Verzending", sub: "België & Nederland" },
];

export function Hero() {
  return (
    <section className="relative bg-[#c5e1e4]">
      <Image
        src="/images/hero-pets.jpg"
        alt="Een Maine Coon kat, Siamese kitten en golden retriever puppy spelen met speelgoed"
        width={2752}
        height={1536}
        priority
        sizes="100vw"
        className="h-auto w-full"
      />

      {/* Logo + tagline links over de blauwe ruimte */}
      <div className="absolute top-24 left-10 z-10 sm:left-16 lg:top-36 lg:left-[14%]">
        <Image
          src="/images/logo.png"
          alt="Pawhaus"
          width={468}
          height={85}
          priority
          className="h-auto w-56 sm:w-80 lg:w-[34rem]"
        />

        <p className="font-display mt-3 flex items-center gap-2 text-xl font-extrabold tracking-tight text-[#0C2A5A] sm:text-2xl lg:mt-4 lg:text-[2rem]">
          Alles voor jouw beste vriend.
          <Image
            src="/images/heart.png"
            alt=""
            width={102}
            height={116}
            className="h-[1em] w-auto shrink-0"
          />
        </p>

        <p className="mt-4 max-w-[34rem] text-base leading-relaxed font-medium text-[#243B63] sm:text-lg lg:mt-5 lg:text-xl">
          De leukste producten voor honden &amp; katten,
          <br />
          met liefde gekozen.
        </p>

        <div className="relative mt-7 inline-block lg:mt-8">
          <Link
            href="/producten"
            className="inline-flex items-center gap-2.5 rounded-full bg-[#e0533f] px-7 py-3 text-base font-bold text-white shadow-[0_12px_24px_rgba(224,83,63,0.35)] transition-transform duration-200 hover:-translate-y-0.5 lg:px-8 lg:py-3.5 lg:text-lg"
          >
            Shop nu
            <Paw className="size-5 text-white" />
          </Link>

          {/* Handgeschreven doodle naast de knop (desktop) */}
          <div className="pointer-events-none absolute top-7 left-[calc(100%+1.25rem)] hidden w-max lg:block">
            <ArrowDoodle className="ml-7 h-9 w-20 rotate-[36deg] text-[#0C2A5A]" />
            <p className="font-hand mt-1 flex -rotate-3 items-center gap-2 text-2xl text-[#0C2A5A]">
              Voor de liefste maatjes!
              <Image
                src="/images/heart.png"
                alt=""
                width={102}
                height={116}
                className="h-[0.85em] w-auto"
              />
            </p>
          </div>
        </div>
      </div>

      {/* Kortingbadge rechtsboven */}
      <div className="absolute top-20 right-[3%] z-10 hidden size-[168px] -rotate-3 flex-col items-center justify-center rounded-full bg-white text-center shadow-[0_20px_45px_rgba(12,42,90,0.12)] lg:flex">
        <Image
          src="/images/heart.png"
          alt=""
          width={102}
          height={116}
          className="absolute -top-4 -right-2 w-12 rotate-6"
        />
        <span className="text-[52px] leading-[0.9] font-extrabold text-[#e0533f]">
          10%
        </span>
        <span className="mt-1 text-xl font-extrabold text-[#0C2A5A]">
          KORTING
        </span>
        <span className="mt-1.5 max-w-[8rem] text-[0.65rem] font-bold tracking-[0.08em] text-[#0C2A5A] uppercase">
          Op je eerste bestelling!
        </span>
      </div>

      {/* Feature-rij linksonder */}
      <div className="absolute bottom-40 left-[12%] z-10 hidden items-stretch lg:flex">
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            className={`flex w-28 flex-col items-center px-3 text-center ${
              i > 0 ? "border-l border-[#0C2A5A]/10" : ""
            }`}
          >
            <f.Icon className="size-7 text-[#0C2A5A]" strokeWidth={1.4} />
            <p className="mt-2.5 text-[0.8rem] font-semibold tracking-tight text-[#0C2A5A]">
              {f.title}
            </p>
            <p className="mt-0.5 text-[0.7rem] text-[#0C2A5A]/60">{f.sub}</p>
          </div>
        ))}
      </div>

      {/* Handgetekende golvende overgang naar de sectie eronder */}
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 z-[5] block h-14 w-full lg:h-[4.5rem]"
        aria-hidden
      >
        {/* witte vlak met golvende bovenrand */}
        <path
          fill="#ffffff"
          d="M0,66 C90,50 170,74 250,64 C340,53 410,80 520,68 C620,57 690,84 800,70 C910,56 980,82 1090,68 C1190,55 1270,80 1360,66 C1400,60 1424,70 1440,64 L1440,120 L0,120 Z"
        />
        {/* dunne handgetekende accentlijn iets erboven */}
        <path
          fill="none"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeOpacity="0.75"
          d="M14,52 C100,38 175,60 252,50 C342,39 408,66 520,54 C622,44 690,70 800,56 C912,43 980,68 1090,54 C1192,42 1270,66 1360,52 C1398,46 1420,55 1430,50"
        />
      </svg>
    </section>
  );
}
