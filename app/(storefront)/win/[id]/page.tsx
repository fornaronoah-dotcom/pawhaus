import type { Metadata } from "next";
import { getGiveaway } from "@/lib/admin/giveaways";
import { EntryForm } from "./entry-form";

export const metadata: Metadata = {
  title: "Win-actie | Pawhaus",
};
export const dynamic = "force-dynamic";

export default async function WinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const giveaway = await getGiveaway(id);

  const unavailable = !giveaway || giveaway.status !== "open";

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 pt-28 pb-16">
      {unavailable ? (
        <div className="rounded-2xl border bg-card p-8 text-center">
          <h1 className="text-xl font-semibold">Deze win-actie is niet beschikbaar</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Mogelijk is ze afgelopen of nog niet gestart. Hou onze nieuwsbrief in de gaten!
          </p>
        </div>
      ) : (
        <>
          <div className="text-center">
            <p className="text-primary text-sm font-semibold">🎁 Win-actie</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">{giveaway.title}</h1>
            {giveaway.prize ? (
              <p className="mt-2 text-lg">Te winnen: <strong>{giveaway.prize}</strong></p>
            ) : null}
            {giveaway.description ? (
              <p className="text-muted-foreground mt-3 text-sm">{giveaway.description}</p>
            ) : null}
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <EntryForm giveawayId={giveaway.id} />
          </div>

          <p className="text-muted-foreground text-center text-xs">
            Door deel te nemen ga je akkoord dat we je e-mail gebruiken om de winnaar te contacteren.
          </p>
        </>
      )}
    </div>
  );
}
