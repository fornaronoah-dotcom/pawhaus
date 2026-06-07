import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, ShieldCheck, Truck } from "lucide-react";
import { Hero } from "@/components/Hero";
import { Paw } from "@/components/Paw";
import { Bundles } from "@/components/Bundles";
import { ProductGrid } from "@/components/ProductGrid";
import { Newsletter } from "@/components/Newsletter";
import { WaveEdge } from "@/components/WaveEdge";
import { getFeaturedProducts } from "@/lib/products";

const WHY = [
  {
    icon: Heart,
    color: "#e0533f",
    title: "Met liefde geselecteerd",
    text: "Elk product is met zorg gekozen voor het welzijn en geluk van jouw dier.",
  },
  {
    icon: Paw,
    color: "#0C2A5A",
    title: "Voor elke poot",
    text: "Geschikt voor honden & katten van alle leeftijden en groottes.",
  },
  {
    icon: ShieldCheck,
    color: "#0C2A5A",
    title: "Veilig & betrouwbaar",
    text: "Betaal veilig en ontvang alleen producten waar wij 100% achter staan.",
  },
  {
    icon: Truck,
    color: "#0C2A5A",
    title: "Snel bij jou thuis",
    text: "Bestel op werkdagen vóór 17:00 en ontvang je pakket snel in huis.",
  },
];

const CATEGORIES = [
  {
    href: "/producten?category=hond",
    title: "Voor de hond",
    description: "Halsbanden, riemen, manden & speelgoed",
    image: "/images/categorie-hond.jpg",
    alt: "Duitse herder",
    cta: "Shop honden",
  },
  {
    href: "/producten?category=kat",
    title: "Voor de kat",
    description: "Krabpalen, voerbakken, manden & meer",
    image: "/images/categorie-kat.jpg",
    alt: "Witte langharige kat",
    cta: "Shop katten",
  },
];

export default async function HomePage() {
  const featured = await getFeaturedProducts(4);

  return (
    <>
      {/* Hero — recreatie van de Pawhaus-mockup */}
      <Hero />

      {/* Categorieën */}
      <section className="relative overflow-hidden">
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
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-tight">Shop per dier</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Vind alles voor jouw hond of kat
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="group ring-foreground/5 relative flex aspect-[16/10] flex-col justify-end overflow-hidden rounded-2xl ring-1 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-[0_22px_45px_rgba(12,42,90,0.25)]"
            >
              <Image
                src={cat.image}
                alt={cat.alt}
                fill
                sizes="(min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
              <div className="relative space-y-1 p-6 text-white">
                <h2 className="text-3xl font-medium">{cat.title}</h2>
                <p className="text-sm text-white/80">{cat.description}</p>
                <span className="mt-3 inline-flex w-max translate-y-1 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0C2A5A] opacity-0 shadow-sm transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
                  {cat.cta}
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
        </div>
      </section>

      {/* Featured producten — blauwe band met golvende randen */}
      <section className="bg-sky-tint text-sky-tint-foreground relative">
        <WaveEdge position="top" />
        <WaveEdge position="bottom" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <h2 className="flex items-center justify-center gap-2 text-4xl font-bold tracking-tight">
              Populaire producten
              <Image
                src="/images/heart.png"
                alt=""
                width={102}
                height={116}
                className="h-[0.8em] w-auto"
              />
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Onze favorieten van dit moment
            </p>
          </div>
          <ProductGrid products={featured} variant="polaroid" />
          <div className="mt-8 text-center">
            <Link
              href="/producten"
              className="text-sm font-medium underline-offset-4 hover:underline"
            >
              Bekijk alles
            </Link>
          </div>

          {/* Voordeelbundels — zelfde band */}
          <Bundles />
        </div>
      </section>

      {/* Waarom kiezen voor Pawhaus? */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="flex flex-wrap items-center justify-center gap-x-2.5 text-4xl font-bold tracking-tight">
            <span>Waarom kiezen voor</span>
            <span className="inline-flex items-center">
              <Image
                src="/images/logo.png"
                alt="Pawhaus"
                width={468}
                height={85}
                className="h-[0.95em] w-auto translate-y-[0.04em]"
              />
              ?
            </span>
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Zorgeloos shoppen voor je beste maatje — daar staan we voor.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map((w) => (
            <div
              key={w.title}
              className="rounded-2xl bg-[#eef2f7] p-8 text-center"
            >
              <w.icon
                className="mx-auto size-9"
                strokeWidth={1.6}
                style={{ color: w.color }}
              />
              <h3 className="mt-5 font-semibold text-[#0C2A5A]">{w.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#0C2A5A]/70">
                {w.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Nieuwsbrief — golvende randen */}
      <section className="bg-sky-tint text-sky-tint-foreground relative">
        <WaveEdge position="top" />
        <WaveEdge position="bottom" />
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-14 text-center sm:px-6 lg:flex-row lg:gap-8 lg:px-8 lg:py-16 lg:text-left">
          <Image
            src="/images/newsletter-pets-v2.png"
            alt="Franse bulldog en grijze kat met speelgoed"
            width={2203}
            height={1381}
            className="h-auto w-52 shrink-0 sm:w-60 lg:w-72"
          />
          <div className="flex-1">
            <h2 className="flex items-center justify-center gap-2 text-3xl font-bold tracking-tight text-[#0C2A5A] lg:justify-start lg:text-4xl">
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
              Ontvang tips, nieuwe producten en exclusieve kortingen
              rechtstreeks in je mailbox.
            </p>
          </div>
          <Newsletter className="lg:w-[28rem]" />
        </div>
      </section>
    </>
  );
}
