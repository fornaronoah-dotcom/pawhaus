"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { Facets, FacetOption } from "@/lib/types";

function parseCsv(value: string | null): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-[#0C2A5A]/10 py-4 first:border-t-0 first:pt-0">
      <h3 className="mb-3 text-sm font-semibold text-[#0C2A5A]">{title}</h3>
      {children}
    </div>
  );
}

function CheckRow({
  option,
  checked,
  onToggle,
}: {
  option: FacetOption;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-2 py-1 text-sm">
      <span className="flex items-center gap-2.5">
        <Checkbox checked={checked} onCheckedChange={onToggle} />
        <span className="text-[#0C2A5A]/80">{option.label}</span>
      </span>
      <span className="text-xs text-[#0C2A5A]/40 tabular-nums">{option.count}</span>
    </label>
  );
}

export function FilterSidebar({
  facets,
  className,
  onNavigate,
}: {
  facets: Facets;
  className?: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const types = parseCsv(sp.get("type"));
  const brands = parseCsv(sp.get("merk"));
  const colors = parseCsv(sp.get("kleur"));
  const min = sp.get("min");
  const max = sp.get("max");

  const hasPrice = facets.priceMax > facets.priceMin;
  const lo = min ? Number(min) : facets.priceMin;
  const hi = max ? Number(max) : facets.priceMax;
  const [range, setRange] = useState<number[]>([lo, hi]);
  useEffect(() => setRange([lo, hi]), [lo, hi]);

  function push(params: URLSearchParams) {
    const q = params.toString();
    router.push(q ? `/producten?${q}` : "/producten");
    onNavigate?.();
  }

  function toggle(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    const cur = parseCsv(params.get(key));
    const next = cur.includes(value)
      ? cur.filter((v) => v !== value)
      : [...cur, value];
    if (next.length) params.set(key, next.join(","));
    else params.delete(key);
    push(params);
  }

  function commitPrice([nlo, nhi]: number[]) {
    const params = new URLSearchParams(sp.toString());
    if (nlo > facets.priceMin) params.set("min", String(Math.round(nlo)));
    else params.delete("min");
    if (nhi < facets.priceMax) params.set("max", String(Math.round(nhi)));
    else params.delete("max");
    push(params);
  }

  function clearAll() {
    const params = new URLSearchParams(sp.toString());
    for (const k of ["type", "merk", "kleur", "min", "max"]) params.delete(k);
    push(params);
  }

  const hasActive =
    types.length || brands.length || colors.length || min || max;

  return (
    <div className={cn("text-[#0C2A5A]", className)}>
      <div className="flex items-center justify-between pb-3">
        <span className="text-base font-bold">Filteren</span>
        {hasActive ? (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-medium text-[#e0533f] hover:underline"
          >
            Wis filters
          </button>
        ) : null}
      </div>

      {facets.categories.length > 0 && (
        <Section title="Categorie">
          <div className="space-y-0.5">
            {facets.categories.map((o) => (
              <CheckRow
                key={o.value}
                option={o}
                checked={types.includes(o.value)}
                onToggle={() => toggle("type", o.value)}
              />
            ))}
          </div>
        </Section>
      )}

      {hasPrice && (
        <Section title="Prijs">
          <Slider
            min={facets.priceMin}
            max={facets.priceMax}
            value={range}
            onValueChange={(v) => setRange(v as number[])}
            onValueCommitted={(v) => commitPrice(v as number[])}
          />
          <div className="mt-1 flex justify-between text-sm text-[#0C2A5A]/70">
            <span>€ {range[0]}</span>
            <span>€ {range[1]}{range[1] >= facets.priceMax ? "+" : ""}</span>
          </div>
        </Section>
      )}

      {facets.brands.length > 0 && (
        <Section title="Merk">
          <div className="space-y-0.5">
            {facets.brands.map((o) => (
              <CheckRow
                key={o.value}
                option={o}
                checked={brands.includes(o.value)}
                onToggle={() => toggle("merk", o.value)}
              />
            ))}
          </div>
        </Section>
      )}

      {facets.colors.length > 0 && (
        <Section title="Kleur">
          <div className="flex flex-wrap gap-2">
            {facets.colors.map((o) => {
              const active = colors.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => toggle("kleur", o.value)}
                  title={`${o.label} (${o.count})`}
                  aria-label={o.label}
                  aria-pressed={active}
                  className={cn(
                    "size-7 rounded-full border border-black/10 transition",
                    active
                      ? "ring-2 ring-[#e0533f] ring-offset-2"
                      : "hover:scale-110",
                  )}
                  style={{ backgroundColor: o.hex }}
                />
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}
