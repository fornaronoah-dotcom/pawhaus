"use client";

import { motion } from "framer-motion";
import { BadgeCheck, Heart, Headphones, Leaf } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const VALUES: { icon: LucideIcon; title: string; sub: string }[] = [
  {
    icon: Heart,
    title: "Liefde & Zorg",
    sub: "We kiezen enkel producten die we zelf met een gerust hart aan onze eigen pets zouden geven.",
  },
  {
    icon: BadgeCheck,
    title: "Kwaliteit",
    sub: "Duurzame, veilige en doordachte producten waar jij én je huisdier lang plezier van hebben.",
  },
  {
    icon: Headphones,
    title: "Service",
    sub: "We staan altijd voor je klaar. Snelle levering, makkelijk retourneren en echte hulp wanneer je die nodig hebt.",
  },
  {
    icon: Leaf,
    title: "Duurzaamheid",
    sub: "We maken bewuste keuzes voor mens, dier en planeet. Want een betere wereld begint bij kleine stappen.",
  },
];

export function OverOnsValues() {
  return (
    <div className="mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-y-10 lg:grid-cols-4 lg:gap-y-0">
      {VALUES.map((v, i) => {
        const Icon = v.icon;
        return (
          <motion.div
            key={v.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.28, delay: i * 0.06, ease: "easeOut" }}
            className={`flex flex-col items-center px-4 text-center sm:px-6 lg:px-7 ${
              i > 0 ? "lg:border-l lg:border-[#0C2A5A]/10" : ""
            }`}
          >
            <span className="grid size-16 place-items-center rounded-full bg-[#FCEAD9] text-[#e0533f]">
              <Icon className="size-7" strokeWidth={1.75} />
            </span>
            <p className="font-display mt-4 text-lg font-bold text-[#0C2A5A]">
              {v.title}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#0C2A5A]/65">
              {v.sub}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
