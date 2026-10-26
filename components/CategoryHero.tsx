import Image from "next/image";
import { Clock, RotateCcw, Truck } from "lucide-react";

const GUARANTEES = [
  { Icon: Truck, title: "Gratis verzending", sub: "vanaf € 75" },
  { Icon: Clock, title: "Voor 15:00 besteld", sub: "vandaag verzonden" },
  { Icon: RotateCcw, title: "Niet goed? Geld terug", sub: "14 dagen bedenktijd" },
];

const ANIMALS: Record<
  string,
  {
    img: string;
    w: number;
    h: number;
    title: string;
    sub: string;
    /** Optioneel afwijkend formaat — brede foto's tonen we wat kleiner. */
    imgClass?: string;
  }
> = {
  hond: {
    img: "/images/producten-hond-2.png",
    w: 1505,
    h: 1350,
    title: "Voor de hond",
    sub: "Alles voor een blije, gezonde en actieve hond.",
    imgClass: "h-28 sm:h-44 lg:h-52 lg:translate-y-5",
  },
  kat: {
    img: "/images/producten-kat-4.png",
    w: 2181,
    h: 1091,
    title: "Voor de kat",
    sub: "Alles voor een tevreden, speelse en verzorgde kat.",
    imgClass: "-ml-3 h-20 sm:-ml-6 sm:h-36 lg:-ml-10 lg:h-44 lg:translate-y-5",
  },
};

export function CategoryHero({
  category,
  search,
  count,
  children,
}: {
  category: string;
  search?: string;
  count: number;
  children?: React.ReactNode;
}) {
  const animal = ANIMALS[category];
  const title = search
    ? `Resultaten voor “${search}”`
    : (animal?.title ?? "Alle producten");
  const sub = search
    ? "Producten die passen bij je zoekopdracht."
    : (animal?.sub ?? "Premium accessoires voor hond én kat, met liefde gekozen.");

  return (
    <div className="bg-sky-tint">
      <div className="mx-auto max-w-7xl px-4 pt-24 pb-6 sm:px-6 sm:pb-8 lg:px-8">
        <div className="flex flex-col gap-5 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            {animal && (
              <Image
                src={animal.img}
                alt=""
                width={animal.w}
                height={animal.h}
                priority
                className={`w-auto shrink-0 translate-y-3 self-end ${animal.imgClass ?? "h-36 sm:h-44 lg:h-52 lg:translate-y-5"}`}
              />
            )}
            <div>
              <h1 className="flex items-center gap-2 text-[1.75rem] leading-tight font-bold sm:text-4xl sm:leading-normal tracking-tight text-[#0C2A5A]">
                {title}
                {animal && (
                  <Image
                    src="/images/heart.png"
                    alt=""
                    width={102}
                    height={116}
                    className="h-[0.7em] w-auto"
                  />
                )}
              </h1>
              <p className="mt-1 max-w-md text-sm text-[#0C2A5A]/70">{sub}</p>
              <p className="mt-2 text-sm font-medium text-[#0C2A5A]">
                <span className="text-[#e0533f]">{count}</span>{" "}
                {count === 1 ? "product" : "producten"} gevonden
              </p>
            </div>
          </div>

          {/* Mobiel: 3 compacte kolommen; vanaf sm naast elkaar in een rij */}
          <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-x-6 sm:gap-y-3 lg:flex-nowrap">
            {GUARANTEES.map(({ Icon, title, sub }) => (
              <div
                key={title}
                className="flex flex-col items-center gap-1.5 text-center sm:flex-row sm:gap-2.5 sm:text-left"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f3e7c9] text-[#0C2A5A] sm:size-10">
                  <Icon className="size-[18px] sm:size-5" strokeWidth={1.6} />
                </span>
                <div className="text-xs leading-tight sm:text-sm">
                  <p className="font-semibold text-[#0C2A5A]">{title}</p>
                  <p className="text-[#0C2A5A]/60">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
