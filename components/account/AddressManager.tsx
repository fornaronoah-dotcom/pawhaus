"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createAddressAction,
  deleteAddressAction,
  updateAddressAction,
  type ActionState,
} from "@/lib/account-actions";
import type { CustomerAddress } from "@/lib/customer/account";

const EMPTY: ActionState = {};

const inputClass =
  "w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm text-[#0C2A5A] outline-none transition focus:border-[#0C2A5A]/40 focus:ring-2 focus:ring-[#0C2A5A]/10";

function Field({
  name,
  label,
  defaultValue,
  required,
  className,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1 block text-xs font-medium text-[#0C2A5A]/60">
        {label}
        {required && " *"}
      </span>
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        className={inputClass}
      />
    </label>
  );
}

function AddressForm({
  address,
  onDone,
}: {
  address?: CustomerAddress;
  onDone: () => void;
}) {
  const action = address ? updateAddressAction : createAddressAction;
  const [state, formAction, pending] = useActionState(action, EMPTY);

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Opgeslagen.");
      onDone();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, onDone]);

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-black/10 bg-[#0C2A5A]/[0.02] p-5"
    >
      {address && <input type="hidden" name="addressId" value={address.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="firstName" label="Voornaam" defaultValue={address?.firstName} required />
        <Field name="lastName" label="Achternaam" defaultValue={address?.lastName} required />
        <Field name="company" label="Bedrijf (optioneel)" defaultValue={address?.company} className="sm:col-span-2" />
        <Field name="address1" label="Straat en huisnummer" defaultValue={address?.address1} required className="sm:col-span-2" />
        <Field name="address2" label="Toevoeging (bus, verdieping)" defaultValue={address?.address2} className="sm:col-span-2" />
        <Field name="zip" label="Postcode" defaultValue={address?.zip} required />
        <Field name="city" label="Plaats" defaultValue={address?.city} required />
        <Field name="zoneCode" label="Provincie (bv. VBR, OVL)" defaultValue={address?.zoneCode} />
        <Field name="territoryCode" label="Landcode" defaultValue={address?.territoryCode ?? "BE"} required />
        <Field name="phoneNumber" label="Telefoon (optioneel)" defaultValue={address?.phoneNumber} className="sm:col-span-2" />
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-[#0C2A5A]/70">
        <input
          type="checkbox"
          name="setDefault"
          defaultChecked={address?.isDefault}
          className="size-4 rounded border-black/20"
        />
        Als standaardadres instellen
      </label>
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[#0C2A5A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#11356f] disabled:opacity-50"
        >
          {pending ? "Opslaan…" : address ? "Adres bijwerken" : "Adres opslaan"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-[#0C2A5A]/70 transition hover:bg-black/5"
        >
          Annuleren
        </button>
      </div>
    </form>
  );
}

export function AddressManager({ addresses }: { addresses: CustomerAddress[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [, startTransition] = useTransition();

  const onDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteAddressAction(id);
      if (res.ok) toast.success(res.message ?? "Adres verwijderd.");
      else toast.error(res.error ?? "Verwijderen mislukt.");
    });
  };

  return (
    <div className="space-y-4">
      {addresses.length === 0 && !showNew && (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-black/5 bg-white py-14 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-[#0C2A5A]/5">
            <MapPin className="size-6 text-[#0C2A5A]" />
          </span>
          <p className="text-sm text-[#0C2A5A]/60">
            Je hebt nog geen adressen opgeslagen.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {addresses.map((addr) =>
          editingId === addr.id ? (
            <AddressForm
              key={addr.id}
              address={addr}
              onDone={() => setEditingId(null)}
            />
          ) : (
            <div
              key={addr.id}
              className="flex items-start justify-between gap-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
            >
              <div className="min-w-0 text-sm text-[#0C2A5A]/80">
                {addr.isDefault && (
                  <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-[#f3b340]/20 px-2 py-0.5 text-xs font-semibold text-[#0C2A5A]">
                    <Star className="size-3 fill-current" /> Standaard
                  </span>
                )}
                {addr.formatted?.length ? (
                  addr.formatted.map((line, i) => <p key={i}>{line}</p>)
                ) : (
                  <p>
                    {[addr.firstName, addr.lastName].filter(Boolean).join(" ")}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  aria-label="Bewerken"
                  onClick={() => setEditingId(addr.id)}
                  className="grid size-9 place-items-center rounded-full text-[#0C2A5A]/60 transition hover:bg-black/5 hover:text-[#0C2A5A]"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Verwijderen"
                  onClick={() => onDelete(addr.id)}
                  className="grid size-9 place-items-center rounded-full text-[#0C2A5A]/60 transition hover:bg-[#e0533f]/10 hover:text-[#e0533f]"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ),
        )}
      </div>

      {showNew ? (
        <AddressForm onDone={() => setShowNew(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 rounded-full border border-[#0C2A5A]/15 px-5 py-2.5 text-sm font-semibold text-[#0C2A5A] transition hover:bg-[#0C2A5A]/5"
        >
          <Plus className="size-4" />
          Nieuw adres toevoegen
        </button>
      )}
    </div>
  );
}
