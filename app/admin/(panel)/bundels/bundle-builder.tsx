"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createBundleAction,
  type BundleFormState,
} from "@/lib/admin-bundle-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type PickerProduct = {
  gid: string;
  numericId: string;
  title: string;
  image: string | null;
  price: string | null;
};

export function BundleBuilder({ products }: { products: PickerProduct[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  // gid → aantal (alleen aangevinkte producten zitten erin)
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [state, formAction, pending] = useActionState<BundleFormState, FormData>(
    createBundleAction,
    {},
  );

  useEffect(() => {
    if (state.ok) {
      toast.success("Bundel aangemaakt in Shopify");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected({});
      router.refresh();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  const visible = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return products;
    return products.filter((p) => p.title.toLowerCase().includes(t));
  }, [search, products]);

  const count = Object.keys(selected).length;

  function toggle(gid: string) {
    setSelected((s) => {
      const next = { ...s };
      if (gid in next) delete next[gid];
      else next[gid] = 1;
      return next;
    });
  }
  function setQty(gid: string, q: number) {
    setSelected((s) => ({ ...s, [gid]: Math.max(1, q || 1) }));
  }

  const itemsJson = JSON.stringify(
    Object.entries(selected).map(([gid, quantity]) => ({
      productGid: gid,
      quantity,
    })),
  );

  return (
    <form action={formAction} className="bg-card flex flex-col gap-4 rounded-xl border p-4">
      <input type="hidden" name="items" value={itemsJson} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Bundeltitel</label>
          <Input name="title" placeholder="bv. Puppy Starterpakket" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Bundelprijs € (optioneel)</label>
          <Input name="price" type="number" step="0.01" min="0" placeholder="laat leeg = som van onderdelen" />
        </div>
      </div>

      {/* Productlijst met vinkjes */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-sm font-medium">
            Producten voor de bundel{" "}
            <span className="text-muted-foreground font-normal">
              ({count} geselecteerd)
            </span>
          </label>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter op titel…"
            className="h-8 w-56"
          />
        </div>

        <div className="max-h-[28rem] divide-y divide-border/60 overflow-y-auto rounded-lg border">
          {visible.length === 0 ? (
            <p className="text-muted-foreground p-4 text-sm">Geen producten gevonden.</p>
          ) : (
            visible.map((p) => {
              const checked = p.gid in selected;
              return (
                <div
                  key={p.gid}
                  className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                    checked ? "bg-primary/5" : "hover:bg-muted/50"
                  }`}
                >
                  <label className="flex flex-1 cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(p.gid)}
                      className="size-4 shrink-0 rounded border-black/20"
                    />
                    {p.image ? (
                      <Image src={p.image} alt="" width={32} height={32} className="ring-foreground/10 h-8 w-8 shrink-0 rounded object-cover ring-1" />
                    ) : (
                      <div className="bg-muted h-8 w-8 shrink-0 rounded" />
                    )}
                    <span className="flex-1 truncate">{p.title}</span>
                    {p.price ? (
                      <span className="text-muted-foreground shrink-0">€ {p.price}</span>
                    ) : null}
                  </label>
                  {checked ? (
                    <label className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs">
                      aantal
                      <Input
                        type="number"
                        min="1"
                        value={selected[p.gid]}
                        onChange={(e) => setQty(p.gid, Number(e.target.value))}
                        className="h-7 w-14"
                      />
                    </label>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
        {count < 2 ? (
          <p className="text-muted-foreground text-sm">Kies minstens 2 producten voor de bundel.</p>
        ) : null}
      </div>

      <div>
        <Button type="submit" disabled={pending || count < 2}>
          {pending ? "Bundel aanmaken… (kan even duren)" : "Bundel aanmaken"}
        </Button>
      </div>
    </form>
  );
}
