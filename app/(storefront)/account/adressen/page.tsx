import { AddressManager } from "@/components/account/AddressManager";
import { getCustomerAddresses } from "@/lib/customer/account";

export const metadata = { title: "Mijn adressen — Pawhaus" };

export default async function AddressesPage() {
  const addresses = await getCustomerAddresses();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#0C2A5A] sm:text-3xl">
          Mijn adressen
        </h1>
        <p className="mt-1 text-sm text-[#0C2A5A]/60">
          Beheer je bezorgadressen voor een snellere checkout.
        </p>
      </header>

      <AddressManager addresses={addresses} />
    </div>
  );
}
