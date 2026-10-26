"use client";

import Image from "next/image";
import Link from "next/link";
import { Loader2, ShoppingBag, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { QuantitySelector } from "@/components/QuantitySelector";
import { useCart } from "@/components/cart/cart-context";
import { CheckoutButton } from "@/components/CheckoutButton";
import { formatPrice } from "@/lib/utils";

export function CartDrawer() {
  const { cart, isOpen, closeCart, updateItem, removeItem, isPending } =
    useCart();

  const empty = cart.lines.length === 0;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Winkelmand</SheetTitle>
          <SheetDescription className="sr-only">
            Overzicht van je winkelmand
          </SheetDescription>
        </SheetHeader>

        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
              <ShoppingBag className="size-6" />
            </div>
            <p className="text-muted-foreground text-sm">
              Je winkelmand is nog leeg.
            </p>
            <Button variant="outline" onClick={closeCart}>
              Verder winkelen
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y overflow-y-auto px-4">
              {cart.lines.map((line) => {
                const image = line.merchandise.product.featuredImage;
                return (
                  <li key={line.id} className="flex gap-3 py-4">
                    <Link
                      href={`/product/${line.merchandise.product.handle}`}
                      onClick={closeCart}
                      className="bg-muted relative size-20 shrink-0 overflow-hidden rounded-lg"
                    >
                      {image && (
                        <Image
                          src={image.url}
                          alt={image.altText ?? line.merchandise.product.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                          unoptimized={image.url.endsWith(".svg")}
                        />
                      )}
                    </Link>

                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between gap-2">
                        <Link
                          href={`/product/${line.merchandise.product.handle}`}
                          onClick={closeCart}
                          className="line-clamp-2 text-sm font-medium hover:underline"
                        >
                          {line.merchandise.product.title}
                        </Link>
                        <button
                          type="button"
                          aria-label="Verwijderen"
                          onClick={() => removeItem(line.id)}
                          className="text-muted-foreground hover:text-destructive -m-2 grid size-9 shrink-0 place-items-center transition-colors"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      {line.merchandise.title !== "Standaard" && (
                        <p className="text-muted-foreground text-xs">
                          {line.merchandise.title}
                        </p>
                      )}
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <QuantitySelector
                          value={line.quantity}
                          onChange={(q) => updateItem(line.id, q)}
                          disabled={isPending}
                        />
                        <span className="text-sm font-medium">
                          {formatPrice(line.cost.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <SheetFooter className="border-t pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotaal</span>
                <span className="text-base font-medium">
                  {formatPrice(cart.cost.subtotalAmount)}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                Verzendkosten en kortingen worden bij de afrekenpagina berekend.
              </p>
              <CheckoutButton checkoutUrl={cart.checkoutUrl} />
              <Button variant="ghost" onClick={closeCart}>
                Verder winkelen
              </Button>
              {isPending && (
                <p className="text-muted-foreground flex items-center justify-center gap-1.5 text-xs">
                  <Loader2 className="size-3 animate-spin" /> Bijwerken…
                </p>
              )}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
