"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Heart,
  Menu,
  Search,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SearchBar } from "@/components/SearchBar";
import { useCart } from "@/components/cart/cart-context";
import { useFavorites } from "@/components/favorites/favorites-context";

const NAV_LINKS = [
  { label: "Honden", href: "/producten?category=hond" },
  { label: "Katten", href: "/producten?category=kat" },
  { label: "Alle producten", href: "/producten" },
  { label: "Over ons", href: "/over-ons" },
];

export function Header({
  isAuthed = false,
  accountsEnabled = false,
}: {
  isAuthed?: boolean;
  accountsEnabled?: boolean;
}) {
  const { cart, openCart } = useCart();
  const { count: favCount, hydrated } = useFavorites();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const count = cart.totalQuantity;
  const accountHref = isAuthed
    ? "/account"
    : accountsEnabled
      ? "/api/auth/customer/login"
      : "/account";

  return (
    <header className="sticky top-0 z-40 -mb-20 px-4 pt-4 sm:px-6 lg:px-8">
      {/* Zwevende witte balk */}
      <div className="ring-foreground/5 mx-auto flex h-16 max-w-[76rem] items-center gap-4 rounded-2xl bg-white px-4 shadow-lg ring-1 sm:px-6">
        {/* Mobiel menu */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Menu openen"
          className="md:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="size-5" />
        </Button>

        {/* Logo links */}
        <Link
          href="/"
          className="flex shrink-0 items-center"
          aria-label="Pawhaus — home"
        >
          <Image
            src="/images/logo.png"
            alt="Pawhaus"
            width={1397}
            height={265}
            priority
            className="h-[1.95rem] w-auto"
          />
        </Link>

        {/* Desktop navigatie */}
        <nav className="ml-6 hidden shrink-0 items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Zoekbalk verschijnt inline na klikken op het vergrootglas */}
        <div className="hidden min-w-0 flex-1 justify-center md:flex">
          {searchOpen && (
            <Suspense fallback={null}>
              <SearchBar autoFocus className="w-full max-w-sm" />
            </Suspense>
          )}
        </div>

        {/* Zoeken + Winkelmand-CTA */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label={searchOpen ? "Zoeken sluiten" : "Zoeken"}
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((v) => !v)}
            className="hidden md:inline-flex"
          >
            {searchOpen ? <X className="size-5" /> : <Search className="size-5" />}
          </Button>

          {/* Favorieten */}
          <Link
            href="/favorieten"
            aria-label={`Favorieten (${hydrated ? favCount : 0})`}
            className="relative grid size-9 place-items-center rounded-full text-[#0C2A5A] transition hover:bg-black/5"
          >
            <Heart className="size-5" />
            {hydrated && favCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-[#e0533f] text-[10px] font-bold tabular-nums text-white shadow-sm">
                {favCount > 9 ? "9+" : favCount}
              </span>
            )}
          </Link>

          {/* Account / inloggen */}
          <Link
            href={accountHref}
            aria-label={isAuthed ? "Mijn account" : "Inloggen"}
            className="hidden size-9 place-items-center rounded-full text-[#0C2A5A] transition hover:bg-black/5 sm:grid"
          >
            <User className="size-5" />
          </Link>

          <button
            type="button"
            aria-label={`Winkelmand (${count})`}
            onClick={openCart}
            className="relative inline-flex items-center gap-2 rounded-full bg-[#e0533f] px-3 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#cf4736] sm:px-4"
          >
            <ShoppingCart className="size-5" />
            <span className="hidden sm:inline">Winkelmand</span>
            <ArrowRight className="hidden size-4 sm:inline" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-white text-[10px] font-bold tabular-nums text-[#e0533f] shadow-sm">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobiel menu-paneel */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72">
          <SheetHeader>
            <SheetTitle>
              <Image
                src="/images/logo.png"
                alt="Pawhaus"
                width={1397}
                height={265}
                className="h-6 w-auto"
              />
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-2">
            <Suspense fallback={null}>
              <SearchBar className="mb-4 px-2" />
            </Suspense>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="hover:bg-muted rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}

            <div className="my-2 border-t border-black/5" />

            <Link
              href="/favorieten"
              onClick={() => setMobileOpen(false)}
              className="hover:bg-muted flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
            >
              <Heart className="size-4" />
              Favorieten
              {hydrated && favCount > 0 && (
                <span className="ml-auto rounded-full bg-[#e0533f] px-2 py-0.5 text-[10px] font-bold text-white">
                  {favCount}
                </span>
              )}
            </Link>

            <Link
              href={accountHref}
              onClick={() => setMobileOpen(false)}
              className="hover:bg-muted flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
            >
              <User className="size-4" />
              {isAuthed ? "Mijn account" : "Inloggen"}
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
