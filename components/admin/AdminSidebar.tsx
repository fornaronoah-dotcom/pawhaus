"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, Sun, Moon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NAV, NAV_GROUPS, type FeatureKey } from "@/lib/admin/nav";
import { canAccess, type AdminRole } from "@/lib/admin/roles";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

type SidebarUser = { name: string; email: string; role: AdminRole };
type Flags = Record<FeatureKey, boolean>;

/** "Noah Fornaro" → "NF"; valt terug op de eerste letter. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Is dit nav-item de actieve route? Exact voor /admin, prefix voor subroutes. */
function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

function Brand() {
  return (
    <div className="flex flex-col gap-1.5 px-2 py-1">
      <Image
        src="/images/logo.png"
        alt="Pawhaus"
        width={468}
        height={85}
        priority
        className="h-7 w-auto"
      />
      <span className="text-muted-foreground text-[11px]">Beheerpaneel</span>
    </div>
  );
}

function NavLinks({
  flags,
  role,
  onNavigate,
}: {
  flags: Flags;
  role: AdminRole;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-5">
      {NAV_GROUPS.map((group) => {
        const items = NAV.filter(
          (item) => item.group === group && canAccess(role, item.href),
        );
        if (items.length === 0) return null;
        return (
          <div key={group} className="flex flex-col gap-1">
            <p className="text-muted-foreground/70 px-3 pb-0.5 text-[11px] font-semibold tracking-wider uppercase">
              {group}
            </p>
            {items.map((item) => {
              const soon = item.flag ? !flags[item.flag] : false;
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group/navlink relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground/70 hover:bg-muted hover:text-foreground",
                  )}
                >
                  {active && (
                    <span className="bg-primary absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r-full" />
                  )}
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-colors",
                      active
                        ? "text-primary"
                        : "text-muted-foreground group-hover/navlink:text-foreground",
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                  {soon && (
                    <span className="bg-brand/20 text-brand-foreground rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                      binnenkort
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

function ThemeToggle() {
  const { setTheme } = useTheme();

  // Lees de actuele modus uit de DOM bij klik (geen effect/state → geen
  // hydration-mismatch). De iconen wisselen via de `dark:`-CSS-variant.
  function toggle() {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      aria-label="Thema wisselen"
      onClick={toggle}
    >
      <Sun className="hidden dark:block" />
      <Moon className="block dark:hidden" />
    </Button>
  );
}

function UserFooter({
  user,
  logoutAction,
}: {
  user: SidebarUser;
  logoutAction: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <span className="bg-secondary text-secondary-foreground flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
          {initials(user.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="text-muted-foreground truncate text-xs">
            {user.email} · {user.role}
          </p>
        </div>
        <ThemeToggle />
      </div>
      <form action={logoutAction}>
        <Button type="submit" variant="outline" size="sm" className="w-full">
          Uitloggen
        </Button>
      </form>
    </div>
  );
}

/**
 * Admin-sidebar met iconen, actieve-staat-markering en gegroepeerde navigatie.
 * Op desktop een vaste kolom; op mobiel een hamburger-topbar die de nav in een
 * uitschuif-drawer (Sheet) toont. De server-layout geeft `user`, `flags` en de
 * `logoutAction` door zodat dit een puur client-component blijft.
 */
export function AdminSidebar({
  user,
  flags,
  logoutAction,
}: {
  user: SidebarUser;
  flags: Flags;
  logoutAction: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop: vaste sidebar */}
      <aside className="bg-card sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r md:flex">
        <div className="px-4 py-5">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <NavLinks flags={flags} role={user.role} />
        </div>
        <div className="border-t px-4 py-4">
          <UserFooter user={user} logoutAction={logoutAction} />
        </div>
      </aside>

      {/* Mobiel: topbar met hamburger + drawer */}
      <div className="bg-card/80 sticky top-0 z-30 flex items-center justify-between border-b px-4 py-3 backdrop-blur md:hidden">
        <Brand />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button variant="outline" size="icon" aria-label="Menu openen" />
            }
          >
            <Menu />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 sm:max-w-72">
            <SheetTitle className="sr-only">Navigatie</SheetTitle>
            <div className="px-4 pt-4">
              <Brand />
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-4">
              <NavLinks
                flags={flags}
                role={user.role}
                onNavigate={() => setOpen(false)}
              />
            </div>
            <div className="border-t px-4 py-4">
              <UserFooter user={user} logoutAction={logoutAction} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
