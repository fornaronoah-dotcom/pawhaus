import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";

export const metadata: Metadata = {
  title: "Verzending & retour",
  description:
    "Alles over levertijden, verzendkosten en het retourneren van je bestelling.",
};

export default function VerzendingRetourPage() {
  return (
    <ContentPage
      title="Verzending & retour"
      intro="Hieronder lees je hoe we je bestelling verzenden en hoe retourneren werkt. Dit is een voorbeeldtekst — pas de voorwaarden aan jouw beleid aan."
      sections={[
        {
          heading: "Levertijd",
          paragraphs: [
            "Bestellingen worden doorgaans binnen 2 tot 4 werkdagen geleverd in de Benelux. Je ontvangt een trackingcode zodra je pakket onderweg is.",
          ],
        },
        {
          heading: "Verzendkosten",
          paragraphs: [
            "Verzending is gratis vanaf € 75. Onder dit bedrag rekenen we een vaste bijdrage die je tijdens het afrekenen ziet.",
          ],
        },
        {
          heading: "Retourneren",
          paragraphs: [
            "Niet tevreden? Je kunt artikelen tot 14 dagen na ontvangst retourneren, mits ongebruikt en in de originele verpakking.",
            "Neem contact met ons op via de contactpagina om een retour aan te melden. Na ontvangst en controle storten we het aankoopbedrag terug.",
          ],
        },
      ]}
    />
  );
}
