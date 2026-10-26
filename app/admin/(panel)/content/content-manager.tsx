"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Megaphone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/admin/EmptyState";
import {
  createBannerAction,
  toggleBannerAction,
  deleteBannerAction,
  type ContentActionResult,
} from "@/lib/admin-content-actions";

export type BannerRow = {
  id: string;
  title: string;
  body: string | null;
  linkUrl: string | null;
  active: boolean;
  sortOrder: number;
};

export function ContentManager({ banners }: { banners: BannerRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, formAction, creating] = useActionState<
    ContentActionResult,
    FormData
  >(createBannerAction, { ok: false });

  useEffect(() => {
    if (state.ok) {
      toast.success("Banner aangemaakt");
      router.refresh();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  function run(label: string, fn: () => Promise<ContentActionResult>) {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(label);
        router.refresh();
      } else {
        toast.error(res.error ?? "Actie mislukt");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-sm font-medium">Titel</label>
          <Input name="title" required placeholder="Gratis verzending vanaf € 75" />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-sm font-medium">Tekst (optioneel)</label>
          <Input name="body" placeholder="Extra toelichting…" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Link (optioneel)</label>
          <Input name="linkUrl" placeholder="/producten" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Prioriteit (lager = eerder)</label>
          <Input name="sortOrder" type="number" defaultValue={0} />
        </div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" name="active" /> Direct activeren
        </label>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={creating}>
            {creating ? "Bezig…" : "Banner toevoegen"}
          </Button>
        </div>
      </form>

      {banners.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Nog geen banners"
          description="Voeg een announcement-balk toe die bovenaan de webshop verschijnt."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {banners.map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-3 rounded-xl border bg-card p-3"
            >
              <span
                className={`size-2 shrink-0 rounded-full ${b.active ? "bg-teal" : "bg-muted-foreground/40"}`}
                title={b.active ? "Actief" : "Inactief"}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{b.title}</p>
                {b.body && (
                  <p className="text-muted-foreground truncate text-xs">{b.body}</p>
                )}
              </div>
              <span className="text-muted-foreground text-xs tabular-nums">#{b.sortOrder}</span>
              <Button
                size="xs"
                variant={b.active ? "secondary" : "outline"}
                disabled={pending}
                onClick={() =>
                  run(b.active ? "Gedeactiveerd" : "Geactiveerd", () =>
                    toggleBannerAction(b.id, !b.active),
                  )
                }
              >
                {b.active ? "Actief" : "Inactief"}
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Verwijderen"
                disabled={pending}
                onClick={() => run("Verwijderd", () => deleteBannerAction(b.id))}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
