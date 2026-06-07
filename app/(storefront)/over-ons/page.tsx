import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Over ons",
  description:
    "Maak kennis met Pawhaus — premium accessoires voor hond en kat, met zorg geselecteerd.",
};

export default function OverOnsPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-center text-4xl font-semibold tracking-tight">
        Over ons
      </h1>
      <div className="text-muted-foreground mt-6 space-y-4 leading-relaxed">
        <p>
          Bij Pawhaus geloven we dat accessoires voor je huisdier net zo
          mooi en doordacht mogen zijn als de rest van je interieur. Daarom
          selecteren we elk product met zorg op kwaliteit, duurzaamheid en
          design.
        </p>
        <p>
          We werken samen met betrouwbare leveranciers en verzenden in heel de
          Benelux. Geen schreeuwerige aanbiedingen of wegwerpspullen — wel
          producten waar jij en je beste maatje lang plezier van hebben.
        </p>
        <p>
          Vragen of suggesties? We horen graag van je via onze{" "}
          <a href="/contact" className="text-foreground underline">
            contactpagina
          </a>
          .
        </p>
      </div>
    </article>
  );
}
