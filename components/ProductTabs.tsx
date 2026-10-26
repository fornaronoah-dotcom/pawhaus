"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { PackageCheck, RotateCcw, Truck } from "lucide-react";
import {
  dierFromTags,
  parseAfmetingen,
  parseInhoud,
  splitDescriptionSections,
} from "@/lib/product-meta";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

function prettyType(t: string): string {
  return t
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function ProductTabs({
  product,
  sku,
  editorialImage = "/images/editorial-kat.jpg",
}: {
  product: Product;
  sku: string | null;
  editorialImage?: string;
}) {
  const sections = splitDescriptionSections(product.descriptionHtml);

  // Max 4 tabs: Beschrijving, Kenmerken (indien aanwezig), Specificaties, Levering.
  // Alle overige verhalende <h3>-secties worden in de Beschrijving-tab gevouwen
  // (met hun kopje als subtitel) i.p.v. elk een eigen tab te krijgen. De
  // afmetingen-sectie vervalt — die staat al in de Specificaties-tab.
  const kenmerken = sections.find((s) => /kenmerken/i.test(s.title));
  const narrative = sections.filter(
    (s) => s !== kenmerken && !/afmetingen/i.test(s.title),
  );
  const beschrijvingHtml = narrative
    .map((s) =>
      s.title === "Beschrijving" ? s.html : `<h3>${s.title}</h3>${s.html}`,
    )
    .join("");

  const contentMap = new Map<string, string>([
    ["Beschrijving", beschrijvingHtml],
  ]);
  if (kenmerken) contentMap.set("Kenmerken", kenmerken.html);

  const tabs = [
    "Beschrijving",
    ...(kenmerken ? ["Kenmerken"] : []),
    "Specificaties",
    "Levering",
  ];

  const [active, setActive] = useState(tabs[0]);
  const dier = dierFromTags(product.tags);

  const isFood = /SNACK|KAUW|VOER|VOEDING|BROK/i.test(product.productType || "");
  const dierLow = dier ? dier.toLowerCase() : "huisdier";
  const edTitle = isFood
    ? `Verwen je ${dierLow} met\niets lekkers`
    : `Met liefde gekozen${dier ? ` voor jouw ${dierLow}` : ""}`;
  const edSub = isFood
    ? "Ideaal als beloning of tussendoortje."
    : "Zorgvuldig geselecteerd door Pawhaus.";

  const specs: [string, string | null][] = [
    ["Merk", product.vendor || null],
    ["Geschikt voor", dier],
    ["Inhoud", parseInhoud(product.descriptionHtml)],
    ["Afmetingen", parseAfmetingen(product.descriptionHtml)],
    ["Type", product.productType ? prettyType(product.productType) : null],
    ["SKU", sku || null],
  ];
  const specRows = specs.filter(([, v]) => Boolean(v)) as [string, string][];

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
      {/* Links: tabs + wisselende inhoud */}
      <div>
        {/* Tab-balk — één lijn, scrollt horizontaal als het niet past */}
        <div className="flex gap-x-6 overflow-x-auto border-b [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActive(t)}
              className={cn(
                "relative shrink-0 pb-3 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:text-foreground",
                active === t ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
              {active === t && (
                <motion.span
                  layoutId="pdp-tab-underline"
                  className="bg-primary absolute inset-x-0 -bottom-px h-0.5 rounded-full"
                  transition={{ duration: 0.25, ease: "easeOut" }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="pt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {contentMap.has(active) && (
                <div
                  className="prose-sm text-muted-foreground max-w-none space-y-3 text-sm leading-relaxed [&_h3]:text-foreground [&_h3]:mt-5 [&_h3]:mb-1.5 [&_h3]:text-base [&_h3]:font-semibold [&_li]:my-0.5 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5"
                  dangerouslySetInnerHTML={{ __html: contentMap.get(active)! }}
                />
              )}

              {active === "Specificaties" &&
                (specRows.length > 0 ? (
                  <dl className="text-sm">
                    {specRows.map(([k, v]) => (
                      <div
                        key={k}
                        className="flex justify-between gap-4 border-b border-dashed py-2.5 last:border-0"
                      >
                        <dt className="text-muted-foreground">{k}</dt>
                        <dd className="font-medium">{v}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Geen specificaties beschikbaar.
                  </p>
                ))}

              {active === "Levering" && (
                <ul className="space-y-4 text-sm">
                  <li className="flex gap-3">
                    <Truck className="text-primary mt-0.5 size-5 shrink-0" />
                    <span>
                      <span className="font-medium">Gratis verzending vanaf € 50.</span>{" "}
                      <span className="text-muted-foreground">
                        Onder € 50 reken je een vaste bijdrage af.
                      </span>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <PackageCheck className="text-primary mt-0.5 size-5 shrink-0" />
                    <span>
                      <span className="font-medium">Voor 15:00 besteld, vandaag verzonden.</span>{" "}
                      <span className="text-muted-foreground">
                        Levering doorgaans binnen 2–4 werkdagen.
                      </span>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <RotateCcw className="text-primary mt-0.5 size-5 shrink-0" />
                    <span>
                      <span className="font-medium">30 dagen retourrecht.</span>{" "}
                      <span className="text-muted-foreground">
                        Niet tevreden? Stuur eenvoudig terug.
                      </span>
                    </span>
                  </li>
                </ul>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Rechts: editorial-kaart — altijd zichtbaar, compact en meelopend */}
      <div className="relative h-64 self-start overflow-hidden rounded-3xl bg-[#FFE3D3] sm:h-72 lg:sticky lg:top-28 lg:h-80">
        <Image
          src={editorialImage}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, 100vw"
          className="object-cover object-right"
        />
        {/* Perzik links voor leesbaarheid van de tekst */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FFE3D3] via-[#FFE3D3]/60 to-transparent" />
        {/* Hartje boven-links (zelfde als hero) */}
        <Image
          src="/images/heart.png"
          alt=""
          width={64}
          height={72}
          className="absolute top-6 left-6 z-10 h-7 w-auto"
        />
        {/* Tekst verticaal in het midden */}
        <div className="absolute top-1/2 left-6 z-10 max-w-[60%] -translate-y-1/2">
          <p className="font-poppins text-xl leading-snug font-semibold whitespace-pre-line sm:text-2xl">
            {edTitle}
          </p>
          <p className="text-foreground/80 mt-1.5 text-sm">{edSub}</p>
        </div>
      </div>
    </div>
  );
}
