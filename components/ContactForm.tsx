"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Contactformulier (frontend-only). Koppelen aan e-mail/CRM is werk voor fase 2.
 */
export function ContactForm() {
  const [submitting, setSubmitting] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    // Plaatshouder: hier komt later een Server Action / e-mailintegratie.
    setTimeout(() => {
      toast.success("Bedankt voor je bericht!", {
        description: "We nemen zo snel mogelijk contact met je op.",
      });
      (e.target as HTMLFormElement).reset();
      setSubmitting(false);
    }, 400);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            Naam
          </label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            E-mail
          </label>
          <Input id="email" name="email" type="email" required />
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="message" className="text-sm font-medium">
          Bericht
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="border-input focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-3"
        />
      </div>
      <Button type="submit" size="lg" disabled={submitting} className="h-11">
        {submitting ? "Versturen…" : "Verstuur bericht"}
      </Button>
    </form>
  );
}
