"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createDiscountAction,
  type DiscountFormState,
} from "@/lib/admin-discount-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateDiscountForm() {
  const router = useRouter();
  const [type, setType] = useState<"percentage" | "amount">("percentage");
  const [state, formAction, pending] = useActionState<DiscountFormState, FormData>(
    createDiscountAction,
    {},
  );

  useEffect(() => {
    if (state.ok) {
      toast.success(`Kortingscode ${state.code} aangemaakt`);
      router.refresh();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2">
      <Field label="Titel (intern)">
        <Input name="title" placeholder="bv. Zomeractie 10%" required />
      </Field>
      <Field label="Code (voor de klant)">
        <Input name="code" placeholder="ZOMER10" required className="uppercase" />
      </Field>

      <Field label="Type">
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as "percentage" | "amount")}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
        >
          <option value="percentage">Percentage (%)</option>
          <option value="amount">Vast bedrag (€)</option>
        </select>
      </Field>
      <Field label={type === "percentage" ? "Percentage (1-100)" : "Bedrag in €"}>
        <Input name="value" type="number" step={type === "percentage" ? "1" : "0.01"} min="0" required />
      </Field>

      <Field label="Vervaldatum (optioneel)">
        <Input name="endsAt" type="datetime-local" />
      </Field>
      <Field label="Gebruikslimiet (optioneel)">
        <Input name="usageLimit" type="number" min="1" placeholder="onbeperkt" />
      </Field>

      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="oncePerCustomer" />
        Max. 1 keer per klant
      </label>

      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Aanmaken…" : "Kortingscode aanmaken"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
