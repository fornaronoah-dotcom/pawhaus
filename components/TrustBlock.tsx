"use client";

import { motion } from "framer-motion";
import { PawPrint, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ITEMS: { icon: LucideIcon; title: string; sub: string }[] = [
  { icon: PawPrint, title: "10.000+ tevreden klanten", sub: "Baasjes & hun lievelingen" },
  { icon: Truck, title: "Snelle levering", sub: "Vandaag besteld, snel in huis" },
  { icon: ShieldCheck, title: "Veilig betalen", sub: "Met al je favoriete methodes" },
  { icon: RotateCcw, title: "30 dagen retour", sub: "Niet goed? Geld terug" },
];

export function TrustBlock() {
  return (
    <section className="bg-secondary/40 rounded-[32px] px-6 py-12 sm:px-10 sm:py-14">
      <h2 className="font-poppins text-center text-3xl font-semibold tracking-tight sm:text-4xl">
        Waarom baasjes kiezen voor Pawhaus
      </h2>
      <div className="mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-4 lg:grid-cols-4">
        {ITEMS.map((it, i) => {
          const Icon = it.icon;
          return (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.28, delay: i * 0.06, ease: "easeOut" }}
              className="rounded-2xl bg-white p-6 text-center shadow-[0_8px_24px_rgba(12,42,90,0.06)] ring-1 ring-black/5"
            >
              <span className="bg-accent/70 text-primary mx-auto grid size-12 place-items-center rounded-2xl">
                <Icon className="size-6" />
              </span>
              <p className="mt-4 text-sm font-semibold">{it.title}</p>
              <p className="text-muted-foreground mt-1 text-xs">{it.sub}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
