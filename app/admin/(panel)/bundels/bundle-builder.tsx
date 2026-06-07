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

type Chosen = PickerProduct & { quantity: number };

export function BundleBuilder({ products }: { products: PickerProduct[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [chosen, setChosen] = useState<Chosen[]>([]);
  const [state, formAction, pending] = useActionState<BundleFormState, FormData>(
    createBundleAction,
    {},
  );

  useEffect(() => {
    if (state.ok) {
      toast.success("Bundel aangemaakt in Shopify");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChosen([]);
      router.refresh();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  const results = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return [];
    return products
      .filter((p) => !chosen.some((c) => c.gid === p.gid))
      .filter((p) => p.title.toLowerCase().includes(t))
      .slice(0, 8);
  }, [search, products, chosen]);

  function add(p: PickerProduct) {
    setChosen((c) => [...c, { ...p, quantity: 1 }]);
    setSearch("");
  }
  function setQty(gid: string, q: number) {
    setChosen((c) => c.map((x) => (x.gid === gid ? { ...x, quantity: Math.max(1, q) } : x)));
  }
  function remove(gid: string) {
    setChosen((c) => c.filter((x) => x.gid !== gid));
  }

  const itemsJson = JSON.stringify(
    chosen.map((c) => ({ productGid: c.gid, quantity: c.quantity })),
  );

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-xl border bg-card p-4">
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

      {/* Productzoeker */}
      <div className="relative flex flex-col gap-1.5">
        <label className="text-sm font-medium">Producten toevoegen</label>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoek een product op titel…"
        />
        {results.length > 0 ? (
          <div className="absolute top-full z-10 mt-1 w-full overflow-hidden rounded-lg border bg-card shadow-lg">
            {results.map((p) => (
              <button
                key={p.gid}
                type="button"
                onClick={() => add(p)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
              >
                {p.image ? (
                  <Image src={p.image} alt="" width={28} height={28} className="h-7 w-7 rounded object-cover" />
                ) : (
                  <div className="bg-muted h-7 w-7 rounded" />
                )}
                <span className="flex-1 truncate">{p.title}</span>
                <span className="text-muted-foreground">+ toevoegen</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Gekozen onderdelen */}
      {chosen.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Onderdelen ({chosen.length})</p>
          {chosen.map((c) => (
            <div key={c.gid} className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm">
              {c.image ? (
                <Image src={c.image} alt="" width={32} height={32} className="h-8 w-8 rounded object-cover" />
              ) : (
                <div className="bg-muted h-8 w-8 rounded" />
              )}
              <span className="flex-1 truncate">{c.title}</span>
              <label className="text-muted-foreground flex items-center gap-1 text-xs">
                aantal
                <Input
                  type="number"
                  min="1"
                  value={c.quantity}
                  onChange={(e) => setQty(c.gid, Number(e.target.value))}
                  className="h-7 w-16"
                />
              </label>
              <button type="button" onClick={() => remove(c.gid)} className="text-destructive text-xs hover:underline">
                verwijder
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">Kies minstens 2 producten voor de bundel.</p>
      )}

      <div>
        <Button type="submit" disabled={pending || chosen.length < 2}>
          {pending ? "Bundel aanmaken… (kan even duren)" : "Bundel aanmaken"}
        </Button>
      </div>
    </form>
  );
}
