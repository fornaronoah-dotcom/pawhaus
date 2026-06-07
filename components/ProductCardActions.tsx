"use client";

import { useState } from "react";
import { Heart, Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/cart/cart-context";
import { cn } from "@/lib/utils";

/** Favoriet-toggle (hartje). Zit in een Link, dus navigatie wordt geblokkeerd. */
export function FavoriteButton({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  const [fav, setFav] = useState(false);

  return (
    <button
      type="button"
      aria-pressed={fav}
      aria-label={fav ? "Verwijder uit favorieten" : "Voeg toe aan favorieten"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const next = !fav;
        setFav(next);
        toast.success(
          next ? `${title} toegevoegd aan favorieten` : "Verwijderd uit favorieten",
        );
      }}
      className={cn(
        "grid size-9 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:scale-105 hover:bg-white active:scale-95",
        className,
      )}
    >
      <Heart
        className={cn(
          "size-[18px] transition-colors",
          fav ? "fill-[#e0533f] text-[#e0533f]" : "text-[#0C2A5A]",
        )}
      />
    </button>
  );
}

/** Snel toevoegen aan winkelmand. Zit in een Link, dus navigatie wordt geblokkeerd. */
export function QuickAddButton({
  variantId,
  availableForSale,
  className,
  round = false,
}: {
  variantId: string | null;
  availableForSale: boolean;
  className?: string;
  round?: boolean;
}) {
  const { addItem, isPending } = useCart();
  const disabled = !availableForSale || !variantId || isPending;

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (variantId) addItem(variantId);
  };

  if (round) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        aria-label={availableForSale ? "Toevoegen aan winkelmand" : "Uitverkocht"}
        className={cn(
          "inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e0533f] text-white shadow-sm transition hover:bg-[#cf4736] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40",
          className,
        )}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ShoppingBag className="size-4" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0C2A5A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#11356f] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <ShoppingBag className="size-4" />
      )}
      {availableForSale ? "Toevoegen" : "Uitverkocht"}
    </button>
  );
}
