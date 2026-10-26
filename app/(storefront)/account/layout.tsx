import Link from "next/link";
import { AccountNav } from "@/components/account/AccountNav";
import { isCustomerAccountsConfigured } from "@/lib/customer/config";
import { requireCustomer } from "@/lib/customer/session";

/**
 * Layout voor het klant-account. Beschermd met requireCustomer().
 * Wanneer de Customer Account API nog niet geconfigureerd is, tonen we een
 * nette melding i.p.v. te crashen of in een redirect-lus te belanden.
 */
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isCustomerAccountsConfigured) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-28 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-black/5 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-[#0C2A5A]">
            Accounts zijn nog niet ingesteld
          </h1>
          <p className="mt-2 text-sm text-[#0C2A5A]/60">
            Inloggen wordt binnenkort geactiveerd. Je kunt ondertussen al
            producten bewaren in je favorieten.
          </p>
          <Link
            href="/favorieten"
            className="mt-5 inline-flex rounded-full bg-[#e0533f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#cf4736]"
          >
            Naar mijn favorieten
          </Link>
        </div>
      </div>
    );
  }

  await requireCustomer();

  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 pb-16 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <AccountNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
