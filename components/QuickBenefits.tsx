"use client";

import { motion } from "framer-motion";
import { Heart, RotateCcw, Sparkles, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const BENEFITS: { icon: LucideIcon; title: string; sub: string }[] = [
  { icon: Heart, title: "Met liefde gekozen", sub: "Voor jouw lieveling" },
  { icon: Sparkles, title: "Topkwaliteit", sub: "Zorgvuldig geselecteerd" },
  { icon: Truck, title: "Snel in huis", sub: "Vandaag verzonden" },
  { icon: RotateCcw, title: "14 dagen retour", sub: "Niet goed? Geld terug" },
];

export function QuickBenefits() {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-4 lg:grid-cols-4">
      {BENEFITS.map((c, i) => {
        const Icon = c.icon;
        return (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.28, delay: i * 0.05, ease: "easeOut" }}
            className="flex flex-col items-center gap-2 text-center"
          >
            <Icon className="size-7 text-[#F05A37]" strokeWidth={1.75} />
            <div>
              <p className="text-sm leading-tight font-semibold">{c.title}</p>
              <p className="text-muted-foreground mt-0.5 text-xs leading-snug">
                {c.sub}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
