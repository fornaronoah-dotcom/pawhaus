import Link from "next/link";
import { getActiveBanner } from "@/lib/admin-content";

/**
 * Announcement-balk bovenaan de storefront. Toont de actieve content-banner
 * (beheerd in /admin/content). Rendert niets als er geen actieve banner is.
 * De data is gecachet met tag "content" → verschijnt/verdwijnt zodra de admin
 * een banner (de)activeert.
 */
export async function AnnouncementBar() {
  // Defensief: faalt nooit de hele storefront (bv. vóór de content-migratie
  // bestaat de tabel nog niet).
  let banner = null;
  try {
    banner = await getActiveBanner();
  } catch {
    return null;
  }
  if (!banner) return null;

  const content = (
    <span className="flex flex-wrap items-center justify-center gap-x-2">
      <span className="font-medium">{banner.title}</span>
      {banner.body && <span className="opacity-90">{banner.body}</span>}
    </span>
  );

  return (
    <div className="bg-primary text-primary-foreground px-4 py-2 text-center text-sm">
      {banner.linkUrl ? (
        <Link href={banner.linkUrl} className="hover:underline">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}
