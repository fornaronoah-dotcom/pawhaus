"use client";

import { useActionState } from "react";
import {
  enterGiveawayAction,
  type EntryState,
} from "@/lib/giveaway-actions";

export function EntryForm({ giveawayId }: { giveawayId: string }) {
  const [state, formAction, pending] = useActionState<EntryState, FormData>(
    enterGiveawayAction,
    {},
  );

  if (state.ok) {
    return (
      <div className="rounded-2xl bg-green-50 p-6 text-center text-green-900">
        <p className="text-lg font-semibold">{state.message}</p>
        <p className="mt-1 text-sm">We trekken binnenkort een winnaar — houd je inbox in de gaten.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="giveawayId" value={giveawayId} />
      <input
        name="name"
        placeholder="Je naam (optioneel)"
        className="h-11 rounded-xl border border-input bg-white px-4 text-sm outline-none focus-visible:border-ring"
      />
      <input
        name="email"
        type="email"
        required
        placeholder="Je e-mailadres"
        className="h-11 rounded-xl border border-input bg-white px-4 text-sm outline-none focus-visible:border-ring"
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="newsletter" defaultChecked />
        Ja, hou me op de hoogte van nieuws & aanbiedingen
      </label>
      {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-xl bg-[#e0533f] px-6 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        {pending ? "Bezig…" : "Doe mee!"}
      </button>
    </form>
  );
}
