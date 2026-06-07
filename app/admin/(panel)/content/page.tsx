import type { Metadata } from "next";
import { MODULES } from "@/lib/admin/nav";
import { getFlagMap } from "@/lib/admin/feature-flags";
import { ComingSoon } from "@/components/admin/ComingSoon";

export const metadata: Metadata = {
  title: MODULES.content.label,
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function Page() {
  const flags = await getFlagMap();
  const m = MODULES.content;
  return <ComingSoon label={m.label} description={m.description} planned={m.planned} enabled={flags.content} />;
}
