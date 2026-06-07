import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGiveaway, listEntries } from "@/lib/admin/giveaways";
import { GiveawayControls } from "./giveaway-controls";

export const metadata: Metadata = {
  title: "Giveaway",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("nl-BE", { dateStyle: "short", timeStyle: "short" });

export default async function GiveawayDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const giveaway = await getGiveaway(id);
  if (!giveaway) notFound();

  const entries = await listEntries(id);
  const winner = giveaway.winnerEntryId
    ? entries.find((e) => e.id === giveaway.winnerEntryId) ?? null
    : null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const publicLink = `${siteUrl.replace(/\/$/, "")}/win/${giveaway.id}`;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Link href="/admin/giveaways" className="text-muted-foreground hover:text-foreground text-sm">
        ← Terug naar giveaways
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{giveaway.title}</h1>
        {giveaway.prize ? <p className="text-muted-foreground text-sm">Prijs: {giveaway.prize}</p> : null}
        {giveaway.description ? <p className="mt-1 text-sm">{giveaway.description}</p> : null}
      </div>

      {winner ? (
        <div className="rounded-xl border border-green-300 bg-green-50 p-4 text-sm text-green-900">
          🏆 <strong>Winnaar:</strong> {winner.name ? `${winner.name} — ` : ""}{winner.email}
        </div>
      ) : null}

      <GiveawayControls
        id={giveaway.id}
        status={giveaway.status}
        entries={entries.map((e) => ({ email: e.email, name: e.name, createdAt: e.createdAt.toISOString() }))}
      />

      {/* Publieke deelnamelink */}
      <div className="rounded-xl border bg-card p-4 text-sm">
        <p className="font-medium">Publieke deelnamelink</p>
        {giveaway.status === "open" ? (
          <a href={publicLink} target="_blank" rel="noreferrer" className="text-primary break-all hover:underline">
            {publicLink}
          </a>
        ) : (
          <p className="text-muted-foreground">
            Zet de giveaway op <strong>Open</strong> om deelnames toe te laten via {publicLink}
          </p>
        )}
      </div>

      {/* Deelnemers */}
      <div>
        <h2 className="mb-2 text-base font-medium">Deelnemers ({entries.length})</h2>
        {entries.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nog geen deelnemers.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-3 py-2 font-medium">E-mail</th>
                  <th className="px-3 py-2 font-medium">Naam</th>
                  <th className="px-3 py-2 font-medium">Deelgenomen</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className={`border-b last:border-0 ${e.id === giveaway.winnerEntryId ? "bg-green-50" : ""}`}>
                    <td className="px-3 py-2">{e.email}</td>
                    <td className="px-3 py-2">{e.name ?? "—"}</td>
                    <td className="text-muted-foreground px-3 py-2 whitespace-nowrap">{dateFmt.format(new Date(e.createdAt))}</td>
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
