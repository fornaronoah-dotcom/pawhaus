"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  setGiveawayStatusAction,
  drawWinnerAction,
} from "@/lib/admin-giveaway-actions";
import { Button } from "@/components/ui/button";

type Entry = { email: string; name: string | null; createdAt: string };

export function GiveawayControls({
  id,
  status,
  entries,
}: {
  id: string;
  status: "draft" | "open" | "closed";
  entries: Entry[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function changeStatus(next: "draft" | "open" | "closed") {
    start(async () => {
      await setGiveawayStatusAction(id, next);
      toast.success(`Status → ${next}`);
      router.refresh();
    });
  }

  function draw() {
    start(async () => {
      const res = await drawWinnerAction(id);
      if (res.ok) {
        toast.success(`Winnaar: ${res.winner}`);
        router.refresh();
      } else {
        toast.error(res.error ?? "Kon geen winnaar trekken");
      }
    });
  }

  function exportCsv() {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = ["email,naam,deelgenomen_op"];
    for (const e of entries) lines.push([esc(e.email), esc(e.name ?? ""), e.createdAt.slice(0, 10)].join(","));
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `giveaway-deelnemers-${entries.length}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium">Status:</span>
      {(["draft", "open", "closed"] as const).map((s) => (
        <Button
          key={s}
          size="sm"
          variant={s === status ? "default" : "outline"}
          disabled={pending || s === status}
          onClick={() => changeStatus(s)}
        >
          {s === "draft" ? "Concept" : s === "open" ? "Open" : "Gesloten"}
        </Button>
      ))}
      <span className="mx-1 h-4 w-px bg-border" />
      <Button size="sm" disabled={pending || entries.length === 0} onClick={draw}>
        🎲 Winnaar trekken
      </Button>
      <Button size="sm" variant="secondary" disabled={entries.length === 0} onClick={exportCsv}>
        Export CSV
      </Button>
    </div>
  );
}
