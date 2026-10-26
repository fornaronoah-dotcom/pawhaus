import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";
import { ReorderButton } from "@/components/account/ReorderButton";
import { getCustomerOrders } from "@/lib/customer/account";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Mijn bestellingen — Pawhaus" };

const STATUS_LABELS: Record<string, string> = {
  PAID: "Betaald",
  PENDING: "In behandeling",
  REFUNDED: "Terugbetaald",
  PARTIALLY_REFUNDED: "Deels terugbetaald",
  AUTHORIZED: "Geautoriseerd",
  VOIDED: "Geannuleerd",
};

export default async function OrdersPage() {
  const orders = await getCustomerOrders(25);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#0C2A5A] sm:text-3xl">
        Mijn bestellingen
      </h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-black/5 bg-white py-16 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-[#0C2A5A]/5">
            <Package className="size-7 text-[#0C2A5A]" />
          </span>
          <div>
            <p className="text-lg font-semibold text-[#0C2A5A]">
              Nog geen bestellingen
            </p>
            <p className="mt-1 text-sm text-[#0C2A5A]/60">
              Zodra je iets bestelt, verschijnt het hier.
            </p>
          </div>
          <Link
            href="/producten"
            className="mt-2 rounded-full bg-[#e0533f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#cf4736]"
          >
            Verder winkelen
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <article
              key={order.id}
              className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm"
            >
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 bg-[#0C2A5A]/[0.02] px-5 py-4">
                <div>
                  <p className="font-semibold text-[#0C2A5A]">{order.name}</p>
                  <p className="text-sm text-[#0C2A5A]/60">
                    {new Date(order.processedAt).toLocaleDateString("nl-BE", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {order.financialStatus && (
                    <span className="rounded-full bg-[#0C2A5A]/5 px-3 py-1 font-medium text-[#0C2A5A]">
                      {STATUS_LABELS[order.financialStatus] ??
                        order.financialStatus}
                    </span>
                  )}
                  {order.totalPrice && (
                    <span className="font-bold text-[#0C2A5A]">
                      {formatPrice(order.totalPrice)}
                    </span>
                  )}
                </div>
              </header>

              <div className="divide-y divide-black/5">
                {order.lineItems.map((line, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-black/5">
                      {line.imageUrl && (
                        <Image
                          src={line.imageUrl}
                          alt={line.name}
                          fill
                          sizes="56px"
                          className="object-contain p-1.5"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#0C2A5A]">
                        {line.name}
                      </p>
                      <p className="text-sm text-[#0C2A5A]/60">
                        {line.quantity}×
                        {line.price ? ` ${formatPrice(line.price)}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <footer className="flex justify-end border-t border-black/5 px-5 py-3">
                <ReorderButton
                  items={order.lineItems.map((l) => ({
                    variantId: l.variantId,
                    quantity: l.quantity,
                  }))}
                />
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
