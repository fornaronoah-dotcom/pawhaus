"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  subscribeNewsletterAction,
  type NewsletterState,
} from "@/lib/newsletter-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/admin/StatCard";

export type Subscriber = {
  numericId: string;
  name: string;
  email: string | null;
  createdAt: string;
};

const dateFmt = new Intl.DateTimeFormat("nl-BE", { dateStyle: "short" });

export function MarketingPanel({
  subscribers,
  totalCustomers,
}: {
  subscribers: Subscriber[];
  totalCustomers: number;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<NewsletterState, FormData>(
    subscribeNewsletterAction,
    {},
  );

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Ingeschreven");
      router.refresh();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  function exportCsv() {
    const head = ["email", "naam", "klant_sinds"];
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [head.join(",")];
    for (const s of subscribers) {
      lines.push([esc(s.email ?? ""), esc(s.name), s.createdAt.slice(0, 10)].join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pawhaus-nieuwsbrief-${subscribers.length}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Abonnees" value={subscribers.length} tone="primary" />
        <StatCard label="Totaal klanten" value={totalCustomers} tone="sky" />
        <StatCard
          label="Abonnee-ratio"
          value={totalCustomers ? Math.round((subscribers.length / totalCustomers) * 100) + "%" : "—"}
          tone="teal"
        />
      </div>

      {/* Handmatig toevoegen */}
      <form action={formAction} className="flex flex-wrap items-end gap-2 rounded-xl border bg-card p-4">
        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-sm font-medium">Abonnee handmatig toevoegen</label>
          <Input name="email" type="email" placeholder="naam@voorbeeld.be" required className="max-w-xs" />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Bezig…" : "Inschrijven"}
        </Button>
      </form>

      {/* Lijst + export */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium">Nieuwsbrief-abonnees</h2>
          <Button size="sm" variant="secondary" onClick={exportCsv} disabled={!subscribers.length}>
            Export CSV
          </Button>
        </div>
        {subscribers.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nog geen abonnees. Inschrijvingen via het nieuwsbrief-blok op de site
            of via het formulier hierboven verschijnen hier (als Shopify-klant met
            marketingtoestemming).
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted/60 text-muted-foreground text-left text-xs uppercase tracking-wide">
                  <th className="px-3 py-2.5 font-medium">E-mail</th>
                  <th className="px-3 py-2.5 font-medium">Naam</th>
                  <th className="px-3 py-2.5 font-medium">Klant sinds</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s) => (
                  <tr key={s.numericId} className="hover:bg-accent/40 border-t border-border/60 transition-colors">
                    <td className="px-3 py-2.5">{s.email ?? "—"}</td>
                    <td className="px-3 py-2.5">{s.name}</td>
                    <td className="text-muted-foreground px-3 py-2.5 whitespace-nowrap tabular-nums">
                      {dateFmt.format(new Date(s.createdAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-muted-foreground text-xs">
        Het versturen van campagnes gebeurt in Shopify Email of je e-mailtool —
        gebruik de CSV-export of het Shopify-marketingsegment. Dit paneel beheert
        de inschrijvingen + toestemming (Shopify = bron).
      </p>
    </div>
  );
}
