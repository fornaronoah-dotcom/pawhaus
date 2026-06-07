"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import { createBasicDiscount } from "@/lib/admin-discounts";
import { logActivity } from "@/lib/admin/activity";

export type DiscountFormState = { ok?: boolean; error?: string; code?: string };

export async function createDiscountAction(
  _prev: DiscountFormState,
  formData: FormData,
): Promise<DiscountFormState> {
  const user = await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const type = String(formData.get("type") ?? "percentage") as
    | "percentage"
    | "amount";
  const value = String(formData.get("value") ?? "").trim();
  const endsAt = String(formData.get("endsAt") ?? "").trim();
  const usageLimitRaw = String(formData.get("usageLimit") ?? "").trim();
  const oncePerCustomer = formData.get("oncePerCustomer") === "on";

  if (!title || !code || !value) {
    return { error: "Titel, code en waarde zijn verplicht." };
  }
  if (type === "percentage" && (Number(value) <= 0 || Number(value) > 100)) {
    return { error: "Percentage moet tussen 1 en 100 liggen." };
  }

  const result = await createBasicDiscount({
    title,
    code,
    type,
    value,
    endsAt: endsAt ? new Date(endsAt).toISOString() : null,
    usageLimit: usageLimitRaw ? Number(usageLimitRaw) : null,
    oncePerCustomer,
  });

  if (!result.ok) {
    await logActivity({
      actor: user.id,
      action: "discount.create",
      targetType: "discount",
      severity: "error",
      message: result.error,
    });
    return { error: result.error };
  }

  await logActivity({
    actor: user.id,
    action: "discount.create",
    targetType: "discount",
    targetId: code,
    message: `Kortingscode aangemaakt: ${code}`,
  });

  revalidatePath("/admin/kortingen");
  return { ok: true, code };
}
