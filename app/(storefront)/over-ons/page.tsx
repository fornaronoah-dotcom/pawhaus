import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Award,
  ChevronRight,
  Heart,
  PawPrint,
  Package,
  Truck,
} from "lucide-react";
import { Paw } from "@/components/Paw";
import { OverOnsValues } from "@/components/OverOnsValues";
import { NewsletterSection } from "@/components/NewsletterSection";

export const metadata: Metadata = {
  title: "Over ons",
  description:
    "Maak kennis met Pawhaus — premium accessoires voor hond en kat, met zorg geselecteerd.",
};

/* Tijdelijke placeholder-foto's voor het team — vervang door echte teamfoto's. */
const TEAM: { name: string; role: string; img: string; alt: string }[] = [
  {
    name: "Noah",
    role: "Oprichter & Product",
    img: "/images/A_professional_studio_photograph_of_202606061521.jpeg",
    alt: "Teamlid Noah",
  },
  {
    name: "Lisa",
    role: "Klantenservice",
    img: "/images/A_professional_studio_photograph_of_202606071551.jpeg",
    alt: "Teamlid Lisa",
  },
  {
    name: "Tom",
    role: "Marketing",
    img: "/images/A_professional_studio_photograph_of_202606061520.jpeg",
    alt: "Teamlid Tom",
  },
];

const TRUST: { icon: typeof Truck; title: string; sub: string }[] = [
  {
    icon: Truck,
    title: "Gratis verzending",
    sub: "Vanaf €75 in België en Nederland",
  },
  {
    icon: Package,
    title: "Voor 15:00 besteld",
    sub: "Vandaag verzonden (ma–vr)",
  },
  {
    icon: Award,
    title: "14 dagen retour",
    sub: "Makkelijk retourneren zonder gedoe",
  },
  {
    icon: Heart,
    title: "10.000+ blije pets",
    sub: "En hun baasjes gingen je al voor",
  },
];

export default function OverOnsPage() {
  return (
    <div className="pt-28 lg:pt-36">
      {/* Kruimelpad */}
      <nav className="text-muted-foreground mx-auto mb-8 flex max-w-7xl flex-wrap items-center gap-1 px-4 text-sm sm:px-6 lg:px-8">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">Over ons</span>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[32px] bg-[#FBEDE2]">
          <div className="grid items-center gap-8 p-8 sm:p-10 lg:grid-cols-2 lg:gap-6 lg:p-14">
            <div>
              <p className="text-xs font-bold tracking-[0.12em] text-[#e0533f] uppercase">
                Over Pawhaus
              </p>
              <h1 className="font-display mt-3 flex flex-wrap items-center gap-x-3 text-4xl leading-[1.05] font-extrabold tracking-tight text-[#0C2A5A] sm:text-5xl">
                Alles voor jouw beste vriend.
                <Image
                  src="/images/heart.png"
                  alt=""
                  width={102}
                  height={116}
                  className="h-[0.8em] w-auto"
                />
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-[#243B63]">
                Pawhaus is er voor alle honden en katten (en hun mensen) die
                alleen het allerbeste verdienen. Wij geloven in producten die
                niet alleen mooi en praktisch zijn, maar die écht bijdragen aan
                een gelukkig en gezond leven voor jouw huisdier.
              </p>
              <Link
                href="#ons-verhaal"
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#e0533f] px-7 py-3.5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(224,83,63,0.3)] transition-transform duration-200 hover:-translate-y-0.5"
              >
                Onze missie
                <Paw className="size-4 text-white" />
              </Link>
            </div>

            <div className="relative">
              {/* Decoratieve outlines rechtsboven */}
              <Heart
                className="absolute -top-2 right-2 hidden size-12 -rotate-12 text-[#e0533f]/25 lg:block"
                strokeWidth={1.5}
              />
              <PawPrint
                className="absolute top-16 right-6 hidden size-9 rotate-12 text-[#e0533f]/25 lg:block"
                strokeWidth={1.5}
              />
              <Image
                src="/images/Professional_studio_photograph_of_a_202606060029.jpeg"
                alt="Een hond en kat naast elkaar"
                width={1408}
                height={768}
                priority
                sizes="(min-width: 1024px) 36rem, 100vw"
                className="h-auto w-full rounded-[24px] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Ons verhaal */}
      <section
        id="ons-verhaal"
        className="mx-auto max-w-7xl scroll-mt-32 px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
      >
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <Image
            src="/images/A_professional_studio_photograph_of_202606060018.jpeg"
            alt="Een slapende hond en kat dicht tegen elkaar"
            width={1404}
            height={768}
            sizes="(min-width: 1024px) 36rem, 100vw"
            className="h-auto w-full rounded-[28px] object-cover"
          />
          <div>
            <p className="text-xs font-bold tracking-[0.12em] text-[#e0533f] uppercase">
              Ons verhaal
            </p>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-[#0C2A5A] sm:text-4xl">
              Hoe het allemaal begon
            </h2>
            <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-[#243B63]">
              <p>Pawhaus is ontstaan uit pure liefde voor dieren.</p>
              <p>
                Als huisdierliefhebbers merkten we dat we online vaak moesten
                kiezen tussen kwaliteit, design en service. Dat kon beter. Veel
                beter.
              </p>
              <p>
                Daarom hebben we Pawhaus opgericht: één plek waar je met een
                gerust hart de mooiste en beste producten vindt voor jouw
                huisdier, zonder gedoe. Met snelle service, eerlijke prijzen en
                een passie voor wat we doen.
              </p>
            </div>
            <p className="font-display mt-6 flex items-center gap-2 font-bold text-[#0C2A5A]">
              Voor hen doen we het.
              <Paw className="size-5 text-[#e0533f]" />
            </p>
          </div>
        </div>
      </section>

      {/* Onze waarden */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-24">
        <p className="text-center text-xs font-bold tracking-[0.12em] text-[#e0533f] uppercase">
          Waar we voor staan
        </p>
        <h2 className="font-display mt-3 text-center text-3xl font-bold tracking-tight text-[#0C2A5A] sm:text-4xl">
          Onze waarden
        </h2>
        <OverOnsValues />
      </section>

      {/* Team */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-24">
        <div className="rounded-[32px] bg-[#FBEDE2] p-8 sm:p-10 lg:p-14">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-12">
            <div>
              <p className="text-xs font-bold tracking-[0.12em] text-[#e0533f] uppercase">
                Wie zijn wij?
              </p>
              <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-[#0C2A5A] sm:text-4xl">
                Een team van dierenliefhebbers
              </h2>
              <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-[#243B63]">
                Achter Pawhaus staat een klein, gepassioneerd team dat elke dag
                met liefde werkt aan de beste ervaring voor jou en je huisdier.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {TEAM.map((m) => (
                <div
                  key={m.name}
                  className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(12,42,90,0.06)] ring-1 ring-black/5"
                >
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={m.img}
                      alt={m.alt}
                      fill
                      sizes="(min-width: 640px) 16rem, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <p className="font-display font-bold text-[#0C2A5A]">
                      {m.name}
                    </p>
                    <p className="text-sm text-[#243B63]">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust-strip */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-24">
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.title} className="flex items-center gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#FCEAD9] text-[#e0533f]">
                  <Icon className="size-6" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="text-sm font-bold text-[#0C2A5A]">{t.title}</p>
                  <p className="mt-0.5 text-sm text-[#243B63]">{t.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Nieuwsbrief */}
      <NewsletterSection />
    </div>
  );
}
