"use server";

import { updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import { logActivity } from "@/lib/admin/activity";
import {
  updateVariantPriceQuery,
  setInventoryQuery,
  InventoryScopeError,
} from "@/lib/admin-variants";

export type VariantActionResult = {
  ok: boolean;
  error?: string;
  /** True wanneer de scope write_inventory ontbreekt (her-autorisatie nodig). */
  scopeMissing?: boolean;
};

/** Past de prijs van één variant aan (write_products dekt dit, geen extra scope). */
export async function updateVariantPrice(
  productGid: string,
  variantId: string,
  price: string,
): Promise<VariantActionResult> {
  const user = await requireAdmin();

  const value = price.replace(",", ".").trim();
  if (!value || Number.isNaN(Number(value)) || Number(value) < 0) {
    return { ok: false, error: "Ongeldige prijs." };
  }

  const res = await updateVariantPriceQuery(productGid, variantId, value);
  if (!res.ok) return res;

  updateTag("products");
  await logActivity({
    actor: user.id,
    action: "variant.price",
    targetType: "product",
    targetId: productGid,
    message: `Prijs variant → ${value}`,
  });
  return { ok: true };
}

/** Zet de beschikbare voorraad van een variant (vereist write_inventory). */
export async function setVariantInventory(
  productGid: string,
  inventoryItemId: string,
  locationId: string,
  quantity: number,
): Promise<VariantActionResult> {
  const user = await requireAdmin();

  if (!Number.isFinite(quantity) || quantity < 0) {
    return { ok: false, error: "Ongeldig aantal." };
  }

  try {
    const res = await setInventoryQuery(inventoryItemId, locationId, Math.floor(quantity));
    if (!res.ok) return res;
  } catch (err) {
    if (err instanceof InventoryScopeError) {
      return {
        ok: false,
        scopeMissing: true,
        error:
          "Scope write_inventory ontbreekt — voeg toe aan app 378135740417 en autoriseer opnieuw.",
      };
    }
    throw err;
  }

  updateTag("products");
  await logActivity({
    actor: user.id,
    action: "variant.inventory",
    targetType: "product",
    targetId: productGid,
    message: `Voorraad variant → ${Math.floor(quantity)}`,
  });
  return { ok: true };
}
