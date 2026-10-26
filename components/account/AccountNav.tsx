"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/account", label: "Overzicht", Icon: LayoutDashboard, exact: true },
  { href: "/account/bestellingen", label: "Bestellingen", Icon: Package },
  { href: "/favorieten", label: "Favorieten", Icon: Heart },
  { href: "/account/adressen", label: "Adressen", Icon: MapPin },
  { href: "/account/profiel", label: "Profiel", Icon: User },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-1">
      {LINKS.map(({ href, label, Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-[#0C2A5A] text-white"
                : "text-[#0C2A5A]/70 hover:bg-[#0C2A5A]/5 hover:text-[#0C2A5A]",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
      <a
        href="/api/auth/customer/logout"
        className="mt-1 flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#0C2A5A]/70 transition-colors hover:bg-[#e0533f]/10 hover:text-[#e0533f]"
      >
        <LogOut className="size-4 shrink-0" />
        Uitloggen
      </a>
    </nav>
  );
}
