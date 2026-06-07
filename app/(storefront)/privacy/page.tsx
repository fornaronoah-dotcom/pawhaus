import type { Metadata } from "next";
import { ContentPage } from "@/components/ContentPage";

export const metadata: Metadata = {
  title: "Privacybeleid",
  description: "Hoe Pawhaus omgaat met je persoonsgegevens.",
};

export default function PrivacyPage() {
  return (
    <ContentPage
      title="Privacybeleid"
      updated="1 januari 2026"
      intro="Dit is een voorbeeld-privacybeleid. Laat het vóór livegang controleren en aanvullen door een juridisch adviseur, afgestemd op de GDPR/AVG."
      sections={[
        {
          heading: "Welke gegevens we verzamelen",
          paragraphs: [
            "We verwerken de gegevens die je zelf verstrekt bij een bestelling of contactaanvraag, zoals je naam, e-mailadres en bezorgadres. Betalingen en orderafhandeling verlopen via Shopify.",
          ],
        },
        {
          heading: "Waarvoor we ze gebruiken",
          paragraphs: [
            "We gebruiken je gegevens uitsluitend om je bestelling te verwerken, je te informeren over de status ervan en — met je toestemming — om je onze nieuwsbrief te sturen.",
          ],
        },
        {
          heading: "Je rechten",
          paragraphs: [
            "Je hebt het recht om je gegevens in te zien, te laten corrigeren of te laten verwijderen. Neem hiervoor contact met ons op.",
          ],
        },
      ]}
    />
  );
}
