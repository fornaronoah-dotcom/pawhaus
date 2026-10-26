"use client";

import Image from "next/image";
import Link from "next/link";
import { Loader2, Trash2 } from "lucide-react";
import { QuantitySelector } from "@/components/QuantitySelector";
import { CheckoutButton } from "@/components/CheckoutButton";
import { EmptyState } from "@/components/EmptyState";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/components/cart/cart-context";
import { formatPrice } from "@/lib/utils";

export function CartView() {
  const { cart, updateItem, removeItem, isPending } = useCart();

  if (cart.lines.length === 0) {
    return (
      <EmptyState
        title="Je winkelmand is leeg"
        description="Ontdek onze collectie en voeg je favorieten toe."
        action={{ label: "Verder winkelen", href: "/producten" }}
      />
    );
  }

  return (
    <div className="grid gap-6 sm:gap-10 lg:grid-cols-[1.6fr_1fr]">
      {/* Regels */}
      <ul className="divide-y">
        {cart.lines.map((line) => {
          const image = line.merchandise.product.featuredImage;
          return (
            <li key={line.id} className="flex gap-3 py-5 sm:gap-4 sm:py-6">
              <Link
                href={`/product/${line.merchandise.product.handle}`}
                className="bg-muted relative size-20 shrink-0 overflow-hidden rounded-lg sm:size-28"
              >
                {image && (
                  <Image
                    src={image.url}
                    alt={image.altText ?? line.merchandise.product.title}
                    fill
                    sizes="112px"
                    className="object-cover"
                    unoptimized={image.url.endsWith(".svg")}
                  />
                )}
              </Link>

              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/product/${line.merchandise.product.handle}`}
                      className="line-clamp-2 text-sm font-medium hover:underline sm:text-base"
                    >
                      {line.merchandise.product.title}
                    </Link>
                    {line.merchandise.title !== "Standaard" && (
                      <p className="text-muted-foreground text-sm">
                        {line.merchandise.title}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-medium sm:text-base">
                    {formatPrice(line.cost.totalAmount)}
                  </span>
                </div>

                <div className="mt-auto flex items-center justify-between pt-3 sm:pt-4">
                  <QuantitySelector
                    value={line.quantity}
                    onChange={(q) => updateItem(line.id, q)}
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(line.id)}
                    aria-label="Verwijderen"
                    className="text-muted-foreground -mr-2 p-2 sm:mr-0 sm:p-0 hover:text-destructive flex items-center gap-1.5 text-sm transition-colors"
                  >
                    <Trash2 className="size-4" />
                    <span className="hidden sm:inline">Verwijderen</span>
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Samenvatting */}
      <aside className="h-fit rounded-2xl border p-5 sm:p-6 lg:sticky lg:top-24">
        <h2 className="text-lg font-medium">Overzicht</h2>
        <Separator className="my-4" />
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotaal</dt>
            <dd>{formatPrice(cart.cost.subtotalAmount)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Verzending</dt>
            <dd className="text-muted-foreground">Berekend bij afrekenen</dd>
          </div>
        </dl>
        <Separator className="my-4" />
        <div className="flex justify-between font-medium">
          <span>Totaal</span>
          <span>{formatPrice(cart.cost.totalAmount)}</span>
        </div>
        <div className="mt-6">
          <CheckoutButton checkoutUrl={cart.checkoutUrl} />
        </div>
        {isPending && (
          <p className="text-muted-foreground mt-3 flex items-center justify-center gap-1.5 text-xs">
            <Loader2 className="size-3 animate-spin" /> Bijwerken…
          </p>
        )}
        <Link
          href="/producten"
          className="text-muted-foreground hover:text-foreground mt-4 block text-center text-sm"
        >
          Verder winkelen
        </Link>
      </aside>
    </div>
  );
}
