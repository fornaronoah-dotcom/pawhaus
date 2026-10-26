"use server";

import { revalidatePath } from "next/cache";
import {
  createAddress,
  deleteAddress,
  updateAddress,
  updateCustomerName,
  type AddressInput,
} from "@/lib/customer/account";
import { getCustomerSession } from "@/lib/customer/session";
import { subscribeEmail } from "@/lib/newsletter";

export type ActionState = { ok?: boolean; error?: string; message?: string };

function readAddress(formData: FormData): AddressInput {
  const get = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v || undefined;
  };
  return {
    firstName: get("firstName"),
    lastName: get("lastName"),
    company: get("company"),
    address1: get("address1"),
    address2: get("address2"),
    zip: get("zip"),
    city: get("city"),
    zoneCode: get("zoneCode"),
    territoryCode: get("territoryCode") ?? "BE",
    phoneNumber: get("phoneNumber"),
  };
}

/** Naam (voor- en achternaam) wijzigen. */
export async function updateNameAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!(await getCustomerSession())) return { error: "Je bent niet ingelogd." };
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  try {
    const res = await updateCustomerName(firstName, lastName);
    if (!res.ok) return { error: res.error ?? "Opslaan mislukt." };
    revalidatePath("/account/profiel");
    revalidatePath("/account");
    return { ok: true, message: "Profiel bijgewerkt." };
  } catch (err) {
    console.error("[account] naam opslaan mislukt:", err);
    return { error: "Opslaan mislukt." };
  }
}

/** Inschrijven op de nieuwsbrief vanuit het profiel. */
export async function subscribeNewsletterAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim() || undefined;
  if (!email) return { error: "Geen e-mailadres bekend." };
  const res = await subscribeEmail(email, firstName);
  if (!res.ok) return { error: res.error };
  return {
    ok: true,
    message: res.already
      ? "Je bent al ingeschreven — bedankt!"
      : "Ingeschreven op de nieuwsbrief!",
  };
}

/** Nieuw adres toevoegen. */
export async function createAddressAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!(await getCustomerSession())) return { error: "Je bent niet ingelogd." };
  const setDefault = formData.get("setDefault") === "on";
  try {
    const res = await createAddress(readAddress(formData), setDefault);
    if (!res.ok) return { error: res.error ?? "Adres opslaan mislukt." };
    revalidatePath("/account/adressen");
    return { ok: true, message: "Adres toegevoegd." };
  } catch (err) {
    console.error("[account] adres toevoegen mislukt:", err);
    return { error: "Adres opslaan mislukt." };
  }
}

/** Bestaand adres bijwerken. */
export async function updateAddressAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!(await getCustomerSession())) return { error: "Je bent niet ingelogd." };
  const addressId = String(formData.get("addressId") ?? "");
  if (!addressId) return { error: "Onbekend adres." };
  const setDefault = formData.get("setDefault") === "on";
  try {
    const res = await updateAddress(addressId, readAddress(formData), setDefault);
    if (!res.ok) return { error: res.error ?? "Adres bijwerken mislukt." };
    revalidatePath("/account/adressen");
    return { ok: true, message: "Adres bijgewerkt." };
  } catch (err) {
    console.error("[account] adres bijwerken mislukt:", err);
    return { error: "Adres bijwerken mislukt." };
  }
}

/** Adres verwijderen. */
export async function deleteAddressAction(
  addressId: string,
): Promise<ActionState> {
  if (!(await getCustomerSession())) return { error: "Je bent niet ingelogd." };
  if (!addressId) return { error: "Onbekend adres." };
  try {
    const res = await deleteAddress(addressId);
    if (!res.ok) return { error: res.error ?? "Verwijderen mislukt." };
    revalidatePath("/account/adressen");
    return { ok: true, message: "Adres verwijderd." };
  } catch (err) {
    console.error("[account] adres verwijderen mislukt:", err);
    return { error: "Verwijderen mislukt." };
  }
}
