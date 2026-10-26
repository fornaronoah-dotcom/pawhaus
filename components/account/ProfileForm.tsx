"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import {
  subscribeNewsletterAction,
  updateNameAction,
  type ActionState,
} from "@/lib/account-actions";
import type { CustomerProfile } from "@/lib/customer/account";

const EMPTY: ActionState = {};

const inputClass =
  "w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm text-[#0C2A5A] outline-none transition focus:border-[#0C2A5A]/40 focus:ring-2 focus:ring-[#0C2A5A]/10";

export function ProfileForm({ profile }: { profile: CustomerProfile | null }) {
  const [nameState, nameAction, namePending] = useActionState(
    updateNameAction,
    EMPTY,
  );
  const [newsState, newsAction, newsPending] = useActionState(
    subscribeNewsletterAction,
    EMPTY,
  );

  useEffect(() => {
    if (nameState.ok) toast.success(nameState.message ?? "Opgeslagen.");
    else if (nameState.error) toast.error(nameState.error);
  }, [nameState]);

  useEffect(() => {
    if (newsState.ok) toast.success(newsState.message ?? "Ingeschreven.");
    else if (newsState.error) toast.error(newsState.error);
  }, [newsState]);

  return (
    <div className="space-y-6">
      {/* Persoonsgegevens */}
      <form
        action={nameAction}
        className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"
      >
        <h2 className="text-sm font-semibold tracking-wide text-[#0C2A5A]/50 uppercase">
          Persoonsgegevens
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-[#0C2A5A]/60">
              Voornaam
            </span>
            <input
              name="firstName"
              defaultValue={profile?.firstName ?? ""}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-[#0C2A5A]/60">
              Achternaam
            </span>
            <input
              name="lastName"
              defaultValue={profile?.lastName ?? ""}
              className={inputClass}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-[#0C2A5A]/60">
              E-mailadres
            </span>
            <input
              value={profile?.email ?? ""}
              disabled
              className={`${inputClass} cursor-not-allowed bg-black/[0.03] text-[#0C2A5A]/50`}
            />
            <span className="mt-1 block text-xs text-[#0C2A5A]/40">
              Je e-mailadres beheer je bij het inloggen via Shopify.
            </span>
          </label>
        </div>
        <button
          type="submit"
          disabled={namePending}
          className="mt-4 rounded-full bg-[#0C2A5A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#11356f] disabled:opacity-50"
        >
          {namePending ? "Opslaan…" : "Opslaan"}
        </button>
      </form>

      {/* Nieuwsbrief */}
      <form
        action={newsAction}
        className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"
      >
        <input type="hidden" name="email" value={profile?.email ?? ""} />
        <input
          type="hidden"
          name="firstName"
          value={profile?.firstName ?? ""}
        />
        <h2 className="text-sm font-semibold tracking-wide text-[#0C2A5A]/50 uppercase">
          Nieuwsbrief
        </h2>
        <p className="mt-2 text-sm text-[#0C2A5A]/70">
          {profile?.marketingSubscribed
            ? "Je ontvangt onze nieuwsbrief met tips en aanbiedingen."
            : "Ontvang tips en aanbiedingen voor jouw huisdier."}
        </p>
        <button
          type="submit"
          disabled={newsPending || profile?.marketingSubscribed}
          className="mt-4 rounded-full bg-[#e0533f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#cf4736] disabled:opacity-50"
        >
          {profile?.marketingSubscribed
            ? "Al ingeschreven"
            : newsPending
              ? "Bezig…"
              : "Inschrijven op nieuwsbrief"}
        </button>
      </form>
    </div>
  );
}
