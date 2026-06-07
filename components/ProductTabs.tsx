"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, PackageCheck, RotateCcw, Truck } from "lucide-react";
import {
  dierFromTags,
  parseAfmetingen,
  parseInhoud,
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
}: {
  product: Product;
  sku: string | null;
}) {
  const tabs = [
    product.descriptionHtml ? "Beschrijving" : null,
    "Specificaties",
    "Levering",
  ].filter(Boolean) as string[];

  const [active, setActive] = useState(tabs[0]);
  const dier = dierFromTags(product.tags);

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
    <div>
      {/* Tab-balk */}
      <div className="flex flex-wrap gap-x-8 gap-y-2 border-b">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActive(t)}
            className={cn(
              "relative pb-3 text-sm font-medium transition-colors",
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
            {active === "Beschrijving" && (
              <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
                <div
                  className="prose-sm text-muted-foreground max-w-none space-y-3 text-sm leading-relaxed [&_h3]:text-foreground [&_h3]:mt-5 [&_h3]:mb-1.5 [&_h3]:text-base [&_h3]:font-semibold [&_li]:my-0.5 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5"
                  dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
                />
                <div className="from-accent/70 to-secondary/50 relative hidden overflow-hidden rounded-3xl bg-gradient-to-br p-8 lg:flex lg:flex-col lg:justify-end">
                  <Heart className="text-primary size-8" />
                  <p className="font-poppins mt-4 text-2xl leading-snug font-semibold">
                    Met liefde gekozen{dier ? ` voor jouw ${dier.toLowerCase()}` : ""}
                  </p>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Zorgvuldig geselecteerd door Pawhaus — premium kwaliteit waar je
                    huisdier blij van wordt.
                  </p>
                </div>
              </div>
            )}

            {active === "Specificaties" &&
              (specRows.length > 0 ? (
                <dl className="max-w-xl text-sm">
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
              <ul className="max-w-xl space-y-4 text-sm">
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
  );
}
