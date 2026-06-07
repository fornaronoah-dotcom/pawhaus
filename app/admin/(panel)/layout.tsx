import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guard";
import { logoutAction } from "@/app/admin/actions";
import { getFlagMap } from "@/lib/admin/feature-flags";
import { NAV } from "@/lib/admin/nav";
import { Button } from "@/components/ui/button";

/**
 * Beschermde admin-shell. Deze layout draait requireAdmin() — de autoritatieve
 * auth-controle (de proxy doet enkel een goedkope cookie-check). De login-pagina
 * valt buiten deze route-group en wordt dus NIET geguard (geen redirect-loop).
 *
 * De navigatie toont alle modules; modules achter een feature flag krijgen een
 * "binnenkort"-label tot de owner ze activeert in Instellingen.
 */
export default async function PanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, flags] = await Promise.all([requireAdmin(), getFlagMap()]);

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r bg-card">
        <div className="px-5 py-5">
          <p className="font-baloo text-lg font-semibold">PAWHAUS</p>
          <p className="text-muted-foreground text-xs">Beheerpaneel</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map((item) => {
            const soon = item.flag ? !flags[item.flag] : false;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                <span className={soon ? "text-muted-foreground" : ""}>
                  {item.label}
                </span>
                {soon ? (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    binnenkort
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t px-5 py-4">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="text-muted-foreground mb-3 truncate text-xs">
            {user.email} · {user.role}
          </p>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm" className="w-full">
              Uitloggen
            </Button>
          </form>
        </div>
      </aside>

      <main className="flex-1 px-8 py-8">{children}</main>
    </div>
  );
}
