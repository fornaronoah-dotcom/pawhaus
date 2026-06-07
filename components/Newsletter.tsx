"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  subscribeNewsletterAction,
  type NewsletterState,
} from "@/lib/newsletter-actions";

/** Klein massief pootje, kleurt mee met currentColor. */
function PawMini({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden>
      <ellipse cx="16" cy="27" rx="6" ry="8.5" transform="rotate(-22 16 27)" />
      <ellipse cx="27" cy="19" rx="6.3" ry="9" />
      <ellipse cx="40" cy="19" rx="6.3" ry="9" />
      <ellipse cx="51" cy="27" rx="6" ry="8.5" transform="rotate(22 51 27)" />
      <path d="M33.5 31c8.5 0 15.5 6 15.5 13.2 0 6.8-6.6 10.8-15.5 10.8S18 51 18 44.2C18 37 25 31 33.5 31Z" />
    </svg>
  );
}

/**
 * Nieuwsbrief-inschrijving (pill-stijl). Toont voorlopig een bevestiging
 * (frontend-only). Koppelen aan e-mailprovider/Shopify is werk voor fase 2.
 */
export function Newsletter({ className }: { className?: string }) {
  const [state, formAction, pending] = useActionState<NewsletterState, FormData>(
    subscribeNewsletterAction,
    {},
  );

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Bedankt voor je inschrijving!", {
        description: "Je ontvangt binnenkort onze beste tips en aanbiedingen.",
      });
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form
      action={formAction}
      className={cn(
        "flex w-full max-w-xl items-center rounded-full bg-white p-1.5 shadow-[0_10px_30px_rgba(12,42,90,0.10)]",
        className,
      )}
    >
      <input
        type="email"
        name="email"
        required
        placeholder="Jouw e-mailadres"
        aria-label="E-mailadres"
        className="min-w-0 flex-1 bg-transparent px-5 text-sm text-[#0C2A5A] outline-none placeholder:text-[#0C2A5A]/40"
      />
      <button
        type="submit"
        disabled={pending}
        className="flex shrink-0 items-center gap-2 rounded-full bg-[#e0533f] px-6 py-3 text-sm font-bold text-white transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60"
      >
        {pending ? "Bezig…" : "Aanmelden"}
        <PawMini className="size-4" />
      </button>
    </form>
  );
}
