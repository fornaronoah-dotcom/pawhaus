import type { Metadata } from "next";
import { Mail, MapPin } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Neem contact op met Pawhaus. We helpen je graag verder.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Contact</h1>
        <p className="text-muted-foreground mt-2">
          Een vraag over een product of je bestelling? We helpen je graag.
        </p>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6 text-sm">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-medium">E-mail</p>
              <a
                href="mailto:info@pawhaus.be"
                className="text-muted-foreground hover:text-foreground"
              >
                info@pawhaus.be
              </a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-medium">Adres</p>
              <p className="text-muted-foreground">
                Vul hier je bedrijfsadres in
              </p>
            </div>
          </div>
          <p className="text-muted-foreground">
            We reageren doorgaans binnen één werkdag.
          </p>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
