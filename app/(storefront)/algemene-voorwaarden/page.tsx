import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";

export const metadata: Metadata = {
  title: "Algemene voorwaarden",
  description: "De algemene voorwaarden van Pawhaus.",
};

export default function AlgemeneVoorwaardenPage() {
  return (
    <ContentPage
      title="Algemene voorwaarden"
      updated="1 januari 2026"
      intro="Dit zijn voorbeeld-voorwaarden. Laat ze vóór livegang juridisch controleren en afstemmen op je onderneming."
      sections={[
        {
          heading: "1. Toepasselijkheid",
          paragraphs: [
            "Deze voorwaarden zijn van toepassing op elk aanbod en elke overeenkomst tussen Pawhaus en de klant.",
          ],
        },
        {
          heading: "2. Prijzen en betaling",
          paragraphs: [
            "Alle prijzen zijn in euro en inclusief btw. Betaling verloopt veilig via Shopify Checkout met de daar beschikbare betaalmethodes.",
          ],
        },
        {
          heading: "3. Levering",
          paragraphs: [
            "We streven naar levering binnen de aangegeven termijn. Genoemde levertijden zijn indicatief en gelden niet als fatale termijn.",
          ],
        },
        {
          heading: "4. Herroepingsrecht",
          paragraphs: [
            "Je hebt het recht de overeenkomst binnen 14 dagen zonder opgave van redenen te ontbinden, conform de wettelijke bepalingen.",
          ],
        },
      ]}
    />
  );
}
