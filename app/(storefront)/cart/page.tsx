import type { Metadata } from "next";
import { CartView } from "@/components/CartView";

export const metadata: Metadata = {
  title: "Winkelmand",
  description: "Bekijk en beheer de producten in je winkelmand.",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 pb-12 sm:px-6 sm:pb-16 lg:px-8">
      <h1 className="mb-6 text-center text-3xl sm:mb-8 sm:text-4xl font-semibold tracking-tight">
        Winkelmand
      </h1>
      <CartView />
    </div>
  );
}
