"use client";

import { motion } from "framer-motion";
import { BadgeCheck, Sparkles, Star, Wheat } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { highlightsFromDescription } from "@/lib/product-meta";

const ICONS: LucideIcon[] = [Star, Sparkles, Wheat, BadgeCheck];

const FALLBACK: { title: string; sub: string }[] = [
  { title: "Zorgvuldig geselecteerd", sub: "Alleen kwaliteit" },
  { title: "Snelle levering", sub: "Vandaag verzonden" },
  { title: "Veilig betalen", sub: "Vertrouwd & beveiligd" },
  { title: "Met liefde gekozen", sub: "Voor jouw huisdier" },
];

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const short = (s: string) => (s.length > 42 ? s.slice(0, 41).replace(/\s+\S*$/, "") + "…" : s);

/** Splitst één highlight in titel + ondertitel op een natuurlijk scheidingswoord. */
function splitBenefit(text: string): { title: string; sub: string } {
  const seps = [" — ", " – ", " - ", ": ", " met ", " en ", ", "];
  for (const sep of seps) {
    const i = text.toLowerCase().indexOf(sep);
    if (i > 3) {
      const title = text.slice(0, i).trim();
      const sub = text.slice(i + sep.length).trim();
      if (title.length >= 4 && sub.length >= 3) return { title, sub: cap(short(sub)) };
    }
  }
  return { title: short(text), sub: "" };
}

export function QuickBenefits({ descriptionHtml }: { descriptionHtml: string }) {
  const highlights = highlightsFromDescription(descriptionHtml, 4);

  const cards =
    highlights.length >= 3 ? highlights.map(splitBenefit) : FALLBACK;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
      {cards.map((c, i) => {
        const Icon = ICONS[i % ICONS.length];
        return (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.28, delay: i * 0.05, ease: "easeOut" }}
            className="border-border/60 flex items-center gap-4 rounded-2xl border bg-white px-5 py-4 shadow-[0_6px_20px_rgba(12,42,90,0.05)] transition-transform duration-200 hover:-translate-y-1"
          >
            <span className="bg-accent/60 text-primary grid size-12 shrink-0 place-items-center rounded-2xl">
              <Icon className="size-6" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="text-sm leading-tight font-semibold">{c.title}</p>
              {c.sub && (
                <p className="text-muted-foreground mt-0.5 text-xs leading-snug">
                  {c.sub}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
