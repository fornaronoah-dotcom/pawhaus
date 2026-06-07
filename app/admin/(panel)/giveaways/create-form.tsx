"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createGiveawayAction,
  type GiveawayFormState,
} from "@/lib/admin-giveaway-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function CreateGiveawayForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<GiveawayFormState, FormData>(
    createGiveawayAction,
    {},
  );

  useEffect(() => {
    if (state.ok) {
      toast.success("Giveaway aangemaakt");
      router.refresh();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="grid gap-3 rounded-xl border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Titel</label>
          <Input name="title" placeholder="bv. Win een hondenmand" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Prijs (wat te winnen)</label>
          <Input name="prize" placeholder="bv. Trixie hondenmand t.w.v. €50" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Omschrijving (optioneel)</label>
        <Textarea name="description" rows={3} placeholder="Korte uitleg voor deelnemers…" />
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Aanmaken…" : "Giveaway aanmaken"}
        </Button>
      </div>
    </form>
  );
}
