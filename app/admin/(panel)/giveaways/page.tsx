import type { Metadata } from "next";
import Link from "next/link";
import { listGiveaways } from "@/lib/admin/giveaways";
import { PageHeader } from "@/components/admin/PageHeader";
import { requireAccess } from "@/lib/auth/guard";
import { CreateGiveawayForm } from "./create-form";

export const metadata: Metadata = {
  title: "Giveaways",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("nl-BE", { dateStyle: "short" });
const STATUS: Record<string, string> = { draft: "Concept", open: "Open", closed: "Gesloten" };

export default async function GiveawaysPage() {
  await requireAccess("/admin/giveaways");
  const giveaways = await listGiveaways();

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <PageHeader
        title="Giveaways"
        description="Organiseer winacties met een publiek deelnameformulier en trek een willekeurige winnaar."
      />

      <CreateGiveawayForm />

      <div>
        <h2 className="mb-2 text-base font-medium">Alle giveaways</h2>
        {giveaways.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nog geen giveaways.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted/60 text-muted-foreground text-left text-xs uppercase tracking-wide">
                  <th className="px-3 py-2.5 font-medium">Titel</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Deelnemers</th>
                  <th className="px-3 py-2.5 font-medium">Aangemaakt</th>
                </tr>
              </thead>
              <tbody>
                {giveaways.map((g) => (
                  <tr key={g.id} className="hover:bg-accent/40 border-t border-border/60 transition-colors">
                    <td className="px-3 py-2.5">
                      <Link href={`/admin/giveaways/${g.id}`} className="font-medium hover:underline">
                        {g.title}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">{STATUS[g.status]}</td>
                    <td className="px-3 py-2.5 tabular-nums">{g.entryCount}</td>
                    <td className="text-muted-foreground px-3 py-2.5 whitespace-nowrap tabular-nums">
                      {dateFmt.format(new Date(g.createdAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
