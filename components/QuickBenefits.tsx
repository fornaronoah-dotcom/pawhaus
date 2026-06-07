"use client";

import { motion } from "framer-motion";
import { Heart, PawPrint, ShieldCheck, Sparkles, Truck, Wheat } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { highlightsFromDescription } from "@/lib/product-meta";

const ICONS: LucideIcon[] = [Heart, Sparkles, Wheat, PawPrint];

const FALLBACK: { icon: LucideIcon; title: string; sub: string }[] = [
  { icon: Sparkles, title: "Zorgvuldig geselecteerd", sub: "Alleen kwaliteit" },
  { icon: Truck, title: "Snelle levering", sub: "Vandaag verzonden" },
  { icon: ShieldCheck, title: "Veilig betalen", sub: "Vertrouwd & beveiligd" },
  { icon: Heart, title: "Met liefde gekozen", sub: "Voor jouw huisdier" },
];

export function QuickBenefits({ descriptionHtml }: { descriptionHtml: string }) {
  const highlights = highlightsFromDescription(descriptionHtml, 4);

  const cards =
    highlights.length >= 3
      ? highlights.map((h, i) => ({
          icon: ICONS[i % ICONS.length],
          title: h,
          sub: "",
        }))
      : FALLBACK;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.28, delay: i * 0.05, ease: "easeOut" }}
            className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-[0_8px_24px_rgba(12,42,90,0.06)] ring-1 ring-black/5 backdrop-blur transition-transform duration-200 hover:-translate-y-1"
          >
            <span className="bg-accent/70 text-primary grid size-10 place-items-center rounded-xl">
              <Icon className="size-5" />
            </span>
            <p className="mt-3 text-sm font-semibold">{c.title}</p>
            {c.sub && (
              <p className="text-muted-foreground mt-0.5 text-xs">{c.sub}</p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
