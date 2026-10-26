import type { Metadata } from "next";
import { MODULES } from "@/lib/admin/nav";
import { requireAccess } from "@/lib/auth/guard";
import { listBanners } from "@/lib/admin-content";
import { PageHeader } from "@/components/admin/PageHeader";
import { ContentManager } from "./content-manager";

export const metadata: Metadata = {
  title: MODULES.content.label,
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function ContentPage() {
  await requireAccess("/admin/content");
  let banners: Awaited<ReturnType<typeof listBanners>> = [];
  try {
    banners = await listBanners();
  } catch {
    // Tabel bestaat nog niet (migratie 0008 niet gedraaid) → lege lijst.
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="Content"
        description="Beheer de announcement-balk bovenaan de webshop. De actieve banner met de hoogste prioriteit wordt getoond."
      />
      <ContentManager
        banners={banners.map((b) => ({
          id: b.id,
          title: b.title,
          body: b.body,
          linkUrl: b.linkUrl,
          active: b.active,
          sortOrder: b.sortOrder,
        }))}
      />
    </div>
  );
}
