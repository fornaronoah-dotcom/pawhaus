import Link from "next/link";
import { ArrowRight, Heart, MapPin, Package, User } from "lucide-react";
import { getCustomerOrders, getCustomerProfile } from "@/lib/customer/account";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Mijn account — Pawhaus" };

const SHORTCUTS = [
  { href: "/account/bestellingen", label: "Bestellingen", Icon: Package },
  { href: "/favorieten", label: "Favorieten", Icon: Heart },
  { href: "/account/adressen", label: "Adressen", Icon: MapPin },
  { href: "/account/profiel", label: "Profiel", Icon: User },
];

export default async function AccountOverviewPage() {
  const [profile, orders] = await Promise.all([
    getCustomerProfile(),
    getCustomerOrders(1),
  ]);

  const lastOrder = orders[0] ?? null;
  const naam = profile?.firstName || profile?.displayName || "klant";

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-[#0C2A5A] sm:text-3xl">
          Hallo {naam} 👋
        </h1>
        {profile?.email && (
          <p className="mt-1 text-sm text-[#0C2A5A]/60">{profile.email}</p>
        )}
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {SHORTCUTS.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center justify-between rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-[#0C2A5A]/5 text-[#0C2A5A]">
                <Icon className="size-5" />
              </span>
              <span className="font-semibold text-[#0C2A5A]">{label}</span>
            </span>
            <ArrowRight className="size-4 text-[#0C2A5A]/40 transition group-hover:translate-x-0.5 group-hover:text-[#e0533f]" />
          </Link>
        ))}
      </div>

      <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold tracking-wide text-[#0C2A5A]/50 uppercase">
          Laatste bestelling
        </h2>
        {lastOrder ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-[#0C2A5A]">{lastOrder.name}</p>
              <p className="text-sm text-[#0C2A5A]/60">
                {new Date(lastOrder.processedAt).toLocaleDateString("nl-BE", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                {lastOrder.totalPrice
                  ? ` · ${formatPrice(lastOrder.totalPrice)}`
                  : ""}
              </p>
            </div>
            <Link
              href="/account/bestellingen"
              className="rounded-full bg-[#0C2A5A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#11356f]"
            >
              Alle bestellingen
            </Link>
          </div>
        ) : (
          <p className="mt-2 text-sm text-[#0C2A5A]/60">
            Je hebt nog geen bestellingen geplaatst.
          </p>
        )}
      </section>
    </div>
  );
}
