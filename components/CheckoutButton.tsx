"use client";

import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Stuurt de klant door naar Shopify Checkout (cart.checkoutUrl).
 * In demo-modus (geen Shopify gekoppeld) is checkoutUrl leeg en tonen we een
 * duidelijke melding in plaats van een redirect.
 */
export function CheckoutButton({
  checkoutUrl,
  className,
}: {
  checkoutUrl: string;
  className?: string;
}) {
  const demo = !checkoutUrl;

  if (demo) {
    return (
      <Button
        type="button"
        size="lg"
        className={cn("h-12 w-full", className)}
        onClick={() =>
          toast.info("Demo-modus", {
            description:
              "Koppel een Shopify-store (Storefront token) om af te rekenen.",
          })
        }
      >
        Afrekenen
        <ArrowRight className="size-4" />
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      className={cn("h-12 w-full", className)}
      render={<a href={checkoutUrl} />}
    >
      Afrekenen
      <ArrowRight className="size-4" />
    </Button>
  );
}
