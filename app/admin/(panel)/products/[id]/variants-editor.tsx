"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Callout } from "@/components/admin/Callout";
import type { AdminVariant } from "@/lib/admin-variants";
import {
  updateVariantPrice,
  setVariantInventory,
} from "@/lib/admin-variant-actions";

export function VariantsEditor({
  productGid,
  variants,
  locationId,
}: {
  productGid: string;
  variants: AdminVariant[];
  locationId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [scopeMissing, setScopeMissing] = useState(false);

  if (variants.length === 0) {
    return <p className="text-muted-foreground text-sm">Geen varianten gevonden.</p>;
  }

  function savePrice(variantId: string, price: string) {
    startTransition(async () => {
      const res = await updateVariantPrice(productGid, variantId, price);
      if (res.ok) {
        toast.success("Prijs bijgewerkt");
        router.refresh();
      } else {
        toast.error(res.error ?? "Kon prijs niet opslaan");
      }
    });
  }

  function saveStock(inventoryItemId: string, qty: string) {
    if (!locationId) return;
    startTransition(async () => {
      const res = await setVariantInventory(
        productGid,
        inventoryItemId,
        locationId,
        Number(qty),
      );
      if (res.ok) {
        toast.success("Voorraad bijgewerkt");
        router.refresh();
      } else if (res.scopeMissing) {
        setScopeMissing(true);
        toast.error("Voorraad-scope ontbreekt");
      } else {
        toast.error(res.error ?? "Kon voorraad niet opslaan");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {scopeMissing && (
        <Callout variant="warning" title="Voorraad bewerken vereist write_inventory">
          Voeg de scope <code>write_inventory</code> toe aan app 378135740417 en
          autoriseer opnieuw. Prijs bewerken werkt al wel.
        </Callout>
      )}
      <div className="flex flex-col divide-y rounded-xl border">
        {variants.map((v) => (
          <VariantRow
            key={v.id}
            variant={v}
            canEditStock={Boolean(locationId) && v.tracked && v.inventoryItemId !== null}
            pending={pending}
            onSavePrice={(p) => savePrice(v.id, p)}
            onSaveStock={(q) => v.inventoryItemId && saveStock(v.inventoryItemId, q)}
          />
        ))}
      </div>
    </div>
  );
}

function VariantRow({
  variant,
  canEditStock,
  pending,
  onSavePrice,
  onSaveStock,
}: {
  variant: AdminVariant;
  canEditStock: boolean;
  pending: boolean;
  onSavePrice: (price: string) => void;
  onSaveStock: (qty: string) => void;
}) {
  const [price, setPrice] = useState(variant.price);
  const [stock, setStock] = useState(
    variant.inventoryQuantity != null ? String(variant.inventoryQuantity) : "",
  );

  const priceDirty = price !== variant.price;
  const stockDirty =
    stock !== (variant.inventoryQuantity != null ? String(variant.inventoryQuantity) : "");

  return (
    <div className="flex flex-wrap items-end gap-3 p-3">
      <span className="min-w-32 flex-1 text-sm font-medium">{variant.options}</span>

      <div className="flex flex-col gap-1">
        <label className="text-muted-foreground text-xs">Prijs (€)</label>
        <div className="flex items-center gap-1.5">
          <Input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            className="h-8 w-24 tabular-nums"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={pending || !priceDirty}
            onClick={() => onSavePrice(price)}
          >
            Opslaan
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-muted-foreground text-xs">Voorraad</label>
        <div className="flex items-center gap-1.5">
          <Input
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            inputMode="numeric"
            disabled={!canEditStock}
            placeholder={canEditStock ? "" : "n.v.t."}
            className="h-8 w-20 tabular-nums"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={pending || !canEditStock || !stockDirty}
            onClick={() => onSaveStock(stock)}
          >
            Opslaan
          </Button>
        </div>
      </div>
    </div>
  );
}
