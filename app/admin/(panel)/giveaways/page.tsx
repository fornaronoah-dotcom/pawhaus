import type { Metadata } from "next";
import Link from "next/link";
import { listGiveaways } from "@/lib/admin/giveaways";
import { CreateGiveawayForm } from "./create-form";

export const metadata: Metadata = {
  title: "Giveaways",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("nl-BE", { dateStyle: "short" });
const STATUS: Record<string, string> = { draft: "Concept", open: "Open", closed: "Gesloten" };

export default async function GiveawaysPage() {
  const giveaways = await listGiveaways();

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Giveaways</h1>
        <p className="text-muted-foreground text-sm">
          Organiseer winacties met een publiek deelnameformulier en trek een willekeurige winnaar.
        </p>
      </div>

      <CreateGiveawayForm />

      <div>
        <h2 className="mb-2 text-base font-medium">Alle giveaways</h2>
        {giveaways.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nog geen giveaways.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-3 py-2 font-medium">Titel</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Deelnemers</th>
                  <th className="px-3 py-2 font-medium">Aangemaakt</th>
                </tr>
              </thead>
              <tbody>
                {giveaways.map((g) => (
                  <tr key={g.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-3 py-2">
                      <Link href={`/admin/giveaways/${g.id}`} className="font-medium hover:underline">
                        {g.title}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{STATUS[g.status]}</td>
                    <td className="px-3 py-2">{g.entryCount}</td>
                    <td className="text-muted-foreground px-3 py-2 whitespace-nowrap">
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
