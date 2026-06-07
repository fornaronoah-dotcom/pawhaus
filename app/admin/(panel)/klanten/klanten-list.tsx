"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import type { AdminCustomer } from "@/lib/admin-customers";

type SortKey = "name" | "orders" | "spent" | "created";
const dateFmt = new Intl.DateTimeFormat("nl-BE", { dateStyle: "short" });
const PAGE_SIZE = 50;

export function KlantenList({ customers }: { customers: AdminCustomer[] }) {
  const [search, setSearch] = useState("");
  const [marketing, setMarketing] = useState<"all" | "yes" | "no">("all");
  const [orders, setOrders] = useState<"all" | "has" | "none">("all");
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    let list = customers.filter((c) => {
      if (marketing === "yes" && !c.marketingSubscribed) return false;
      if (marketing === "no" && c.marketingSubscribed) return false;
      if (orders === "has" && c.orders === 0) return false;
      if (orders === "none" && c.orders > 0) return false;
      if (t) {
        const hay = [c.name, c.email ?? "", c.tags.join(" ")].join(" ").toLowerCase();
        if (!hay.includes(t)) return false;
      }
      return true;
    });
    const dir = sortDir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case "name": return a.name.localeCompare(b.name) * dir;
        case "orders": return (a.orders - b.orders) * dir;
        case "spent": return ((a.spent ? +a.spent.amount : 0) - (b.spent ? +b.spent.amount : 0)) * dir;
        case "created": return a.createdAt.localeCompare(b.createdAt) * dir;
      }
    });
    return list;
  }, [customers, search, marketing, orders, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const rows = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir(k === "name" ? "asc" : "desc"); }
  }
  const arrow = (k: SortKey) => (sortKey === k ? (sortDir === "asc" ? " ▲" : " ▼") : "");

  function exportCsv() {
    const head = ["id", "naam", "email", "bestellingen", "besteed", "marketing", "status", "tags", "aangemaakt"];
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [head.join(",")];
    for (const c of filtered) {
      lines.push([
        c.numericId, esc(c.name), esc(c.email ?? ""), c.orders,
        c.spent?.amount ?? "", c.marketingSubscribed ? "ja" : "nee",
        c.state, esc(c.tags.join("; ")), c.createdAt.slice(0, 10),
      ].join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `pawhaus-klanten-${filtered.length}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Zoek op naam, e-mail of tag…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="h-9 max-w-xs" />
        <select value={marketing} onChange={(e) => { setMarketing(e.target.value as typeof marketing); setPage(0); }} className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm">
          <option value="all">Marketing: alle</option>
          <option value="yes">Geabonneerd</option>
          <option value="no">Niet geabonneerd</option>
        </select>
        <select value={orders} onChange={(e) => { setOrders(e.target.value as typeof orders); setPage(0); }} className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm">
          <option value="all">Bestellingen: alle</option>
          <option value="has">Heeft besteld</option>
          <option value="none">Nog niet besteld</option>
        </select>
        <span className="text-muted-foreground ml-auto text-sm">{filtered.length} van {customers.length}</span>
        <Button size="sm" variant="secondary" onClick={exportCsv}>Export CSV</Button>
      </div>

      <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="cursor-pointer px-3 py-2 font-medium" onClick={() => toggleSort("name")}>Naam{arrow("name")}</th>
              <th className="px-3 py-2 font-medium">E-mail</th>
              <th className="cursor-pointer px-3 py-2 font-medium" onClick={() => toggleSort("orders")}>Bestellingen{arrow("orders")}</th>
              <th className="cursor-pointer px-3 py-2 font-medium" onClick={() => toggleSort("spent")}>Besteed{arrow("spent")}</th>
              <th className="px-3 py-2 font-medium">Marketing</th>
              <th className="px-3 py-2 font-medium">Tags</th>
              <th className="cursor-pointer px-3 py-2 font-medium" onClick={() => toggleSort("created")}>Klant sinds{arrow("created")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="text-muted-foreground px-3 py-4">Geen klanten gevonden.</td></tr>
            ) : rows.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/40">
                <td className="px-3 py-2 font-medium">
                  <Link href={`/admin/klanten/${c.numericId}`} className="hover:underline">{c.name}</Link>
                </td>
                <td className="text-muted-foreground px-3 py-2">{c.email ?? "—"}</td>
                <td className="px-3 py-2">{c.orders}</td>
                <td className="px-3 py-2 whitespace-nowrap">{c.spent ? formatPrice(c.spent) : "—"}</td>
                <td className="px-3 py-2">{c.marketingSubscribed ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">ja</span> : <span className="text-muted-foreground text-xs">nee</span>}</td>
                <td className="text-muted-foreground max-w-48 truncate px-3 py-2">{c.tags.join(", ") || "—"}</td>
                <td className="text-muted-foreground px-3 py-2 whitespace-nowrap">{dateFmt.format(new Date(c.createdAt))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Pagina {safePage + 1} / {pageCount}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Vorige</Button>
          <Button size="sm" variant="outline" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}>Volgende</Button>
        </div>
      </div>
    </div>
  );
}
