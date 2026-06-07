import type { Metadata } from "next";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAdminProductCount, isAdminConfigured } from "@/lib/shopify-admin";
import { AdminNotConfigured } from "@/components/admin/AdminNotConfigured";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

// Leest live uit Shopify + leest de sessie-cookie → altijd dynamisch.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let count: number | null = null;
  let error: string | null = null;

  if (isAdminConfigured) {
    try {
      count = await getAdminProductCount();
    } catch (err) {
      error = err instanceof Error ? err.message : "Onbekende fout.";
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Overzicht van je Shopify-producten.
        </p>
      </div>

      {!isAdminConfigured ? (
        <AdminNotConfigured />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardDescription>Totaal producten</CardDescription>
                <CardTitle className="text-3xl">
                  {count ?? "—"}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              Kon Shopify niet bereiken: {error}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
