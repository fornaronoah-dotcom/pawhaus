import { requireAdmin } from "@/lib/auth/guard";
import { logoutAction } from "@/app/admin/actions";
import { getFlagMap } from "@/lib/admin/feature-flags";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

/**
 * Beschermde admin-shell. Deze layout draait requireAdmin() — de autoritatieve
 * auth-controle (de proxy doet enkel een goedkope cookie-check). De login-pagina
 * valt buiten deze route-group en wordt dus NIET geguard (geen redirect-loop).
 *
 * De navigatie (AdminSidebar) is een client-component voor de actieve-staat en
 * de mobiele drawer; auth + feature flags worden hier server-side opgehaald en
 * als props doorgegeven.
 */
export default async function PanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, flags] = await Promise.all([requireAdmin(), getFlagMap()]);

  return (
    <div className="bg-background flex min-h-screen flex-col md:flex-row">
      <AdminSidebar
        user={{ name: user.name, email: user.email, role: user.role }}
        flags={flags}
        logoutAction={logoutAction}
      />

      <main className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-6 md:px-8 md:py-10">
        {children}
      </main>
    </div>
  );
}
