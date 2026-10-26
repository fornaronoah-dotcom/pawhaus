import { ChevronDown } from "lucide-react";

/**
 * Toont de productbeschrijving als uitklapbare secties (accordion).
 * Secties worden afgeleid van de H2/H3-kopjes in de HTML — alles vóór het
 * eerste kopje wordt de "Beschrijving"-sectie. Onderaan komt een vaste
 * "Verzending & retour"-sectie. Gebruikt native <details> (geen JS nodig).
 */

type Section = { title: string; body: string };

function splitSections(html: string): Section[] {
  if (!html?.trim()) return [];
  const parts = html.split(/(<h[23][^>]*>[\s\S]*?<\/h[23]>)/gi);
  const sections: Section[] = [];
  let i = 0;

  // Inhoud vóór het eerste kopje → "Beschrijving".
  if (parts[0] && !/^<h[23]/i.test(parts[0].trim())) {
    if (parts[0].trim()) sections.push({ title: "Beschrijving", body: parts[0] });
    i = 1;
  }
  for (; i < parts.length; i += 2) {
    const heading = parts[i];
    if (!heading) continue;
    const title = heading.replace(/<[^>]+>/g, "").trim() || "Meer info";
    sections.push({ title, body: parts[i + 1] ?? "" });
  }
  return sections;
}

const GLOBAL_SECTIONS: Section[] = [
  {
    title: "Verzending & retour",
    body:
      "<p>Gratis verzending vanaf € 75. Bestel je vóór 15:00 op een werkdag, " +
      "dan versturen we dezelfde dag — levering doorgaans binnen 2–4 werkdagen. " +
      "Niet tevreden? Je hebt 14 dagen bedenktijd.</p>",
  },
];

function Accordion({ section, open }: { section: Section; open?: boolean }) {
  return (
    <details open={open} className="group border-b py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
        {section.title}
        <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div
        className="prose-sm text-muted-foreground mt-2 max-w-none space-y-3 text-sm leading-relaxed [&_a]:underline [&_strong]:text-foreground"
        dangerouslySetInnerHTML={{ __html: section.body }}
      />
    </details>
  );
}

export function ProductDescription({ html }: { html: string }) {
  const sections = splitSections(html);
  const all = [...sections, ...GLOBAL_SECTIONS];
  if (all.length === 0) return null;

  return (
    <div className="border-t">
      {all.map((s, i) => (
        <Accordion key={`${s.title}-${i}`} section={s} open={i === 0} />
      ))}
    </div>
  );
}
