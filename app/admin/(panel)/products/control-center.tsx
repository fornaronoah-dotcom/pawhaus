"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ImageOff, FileWarning } from "lucide-react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { OptStatusBadge } from "@/components/admin/OptStatusBadge";
import { formatPrice, cn } from "@/lib/utils";
import { dierFromTags } from "@/lib/product-meta";
import { productCategory, CATEGORY_ORDER } from "@/lib/product-category";
import { OPT_STATUS_LABELS } from "@/lib/admin/opt-status";
import type { AdminProductRow } from "@/lib/admin-products";
import type { OptStatus } from "@/lib/db/schema";
import {
  bulkAddTags,
  bulkRemoveTags,
  bulkSetShopifyStatus,
  bulkMarkSeoToImprove,
  bulkSetOptStatus,
  bulkPublishToStorefront,
  type BulkResult,
} from "@/lib/admin-bulk-actions";

type SortKey =
  | "title"
  | "cost"
  | "price"
  | "margin"
  | "inventory"
  | "status"
  | "updated";

const dateFmt = new Intl.DateTimeFormat("nl-BE", { dateStyle: "short" });
const PAGE_SIZE = 50;

/** Marge-tint: rood = verlies, amber = mager (<15%), groen = gezond. */
function marginTone(pct: number | null): string {
  if (pct == null) return "text-muted-foreground";
  if (pct < 0) return "text-destructive font-medium";
  if (pct < 15) return "text-brand-foreground";
  return "text-teal";
}

export function ProductControlCenter({
  rows,
  hasMore,
  mode = "catalog",
}: {
  rows: AdminProductRow[];
  hasMore: boolean;
  /** "review" = vereenvoudigde weergave gericht op controleren (AI-review). */
  mode?: "catalog" | "review";
}) {
  const isReview = mode === "review";
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "ACTIVE" | "DRAFT" | "ARCHIVED">("all");
  const [dierFilter, setDierFilter] = useState<"all" | "Hond" | "Kat">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [onlyNoImage, setOnlyNoImage] = useState(false);
  const [onlyNoDesc, setOnlyNoDesc] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tagInput, setTagInput] = useState("");

  // Vriendelijke categorieën (Snacks, Kattenbakken, …) die echt voorkomen,
  // zelf-vullend uit de Shopify-producttypes en op vaste volgorde.
  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of rows) {
      const c = productCategory(r.productType, r.title);
      if (!seen.has(c.key)) seen.set(c.key, c.label);
    }
    return [...seen.entries()]
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => CATEGORY_ORDER.indexOf(a.key) - CATEGORY_ORDER.indexOf(b.key));
  }, [rows]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (typeFilter !== "all" && productCategory(r.productType, r.title).key !== typeFilter) return false;
      if (dierFilter !== "all" && dierFromTags(r.tags) !== dierFilter) return false;
      if (onlyNoImage && r.hasImage) return false;
      if (onlyNoDesc && r.hasDescription) return false;
      if (term) {
        const hay = [r.title, r.vendor, r.sku ?? "", r.tags.join(" ")]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    const num = (v: number | null) => (v == null ? -Infinity : v);
    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case "title":
          return a.title.localeCompare(b.title) * dir;
        case "cost":
          return (num(a.unitCost ? Number(a.unitCost.amount) : null) - num(b.unitCost ? Number(b.unitCost.amount) : null)) * dir;
        case "price":
          return (num(a.minPrice ? Number(a.minPrice.amount) : null) - num(b.minPrice ? Number(b.minPrice.amount) : null)) * dir;
        case "margin":
          return (num(a.marginPct) - num(b.marginPct)) * dir;
        case "inventory":
          return (a.totalInventory - b.totalInventory) * dir;
        case "status":
          return a.status.localeCompare(b.status) * dir;
        case "updated":
          return a.updatedAt.localeCompare(b.updatedAt) * dir;
      }
    });
    return list;
  }, [rows, search, statusFilter, typeFilter, dierFilter, onlyNoImage, onlyNoDesc, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "title" ? "asc" : "desc");
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllFiltered() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) filtered.forEach((r) => next.delete(r.id));
      else filtered.forEach((r) => next.add(r.id));
      return next;
    });
  }

  const selectedGids = useMemo(() => [...selected], [selected]);

  function runBulk(label: string, fn: () => Promise<BulkResult>) {
    if (selectedGids.length === 0) return;
    startTransition(async () => {
      try {
        const res = await fn();
        if (res.ok) toast.success(`${label}: ${res.succeeded} verwerkt`);
        else
          toast.warning(
            `${label}: ${res.succeeded} ok, ${res.failed} fout${res.errors[0] ? ` — ${res.errors[0]}` : ""}`,
          );
        setSelected(new Set());
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Bulk-actie mislukt");
      }
    });
  }

  function exportCsv() {
    const chosen = filtered.filter((r) => selected.has(r.id));
    const rowsToExport = chosen.length ? chosen : filtered;
    const head = [
      "id",
      "titel",
      "handle",
      "sku",
      "status",
      "inkoop",
      "prijs",
      "adviesprijs",
      "marge_pct",
      "voorraad",
      "vendor",
      "type",
      "tags",
      "opt_status",
    ];
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [head.join(",")];
    for (const r of rowsToExport) {
      lines.push(
        [
          r.numericId,
          esc(r.title),
          r.handle,
          esc(r.sku ?? ""),
          r.status,
          r.unitCost?.amount ?? "",
          r.minPrice?.amount ?? "",
          r.adviesprijs?.amount ?? "",
          r.marginPct ?? "",
          r.totalInventory,
          esc(r.vendor),
          esc(r.productType),
          esc(r.tags.join("; ")),
          r.optStatus,
        ].join(","),
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pawhaus-producten-${rowsToExport.length}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const sortArrow = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  return (
    <div className="flex flex-col gap-4">
      {/* Zoek + filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Zoek op titel, merk, tag of SKU…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="h-9 max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as typeof statusFilter);
            setPage(0);
          }}
          className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
        >
          <option value="all">Alle statussen</option>
          <option value="ACTIVE">Actief</option>
          <option value="DRAFT">Concept</option>
          <option value="ARCHIVED">Gearchiveerd</option>
        </select>
        <select
          value={dierFilter}
          onChange={(e) => {
            setDierFilter(e.target.value as typeof dierFilter);
            setPage(0);
          }}
          className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
        >
          <option value="all">Alle dieren</option>
          <option value="Hond">Hond</option>
          <option value="Kat">Kat</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(0);
          }}
          className="h-9 max-w-[12rem] rounded-lg border border-input bg-transparent px-2 text-sm"
        >
          <option value="all">Alle categorieën</option>
          {categories.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" checked={onlyNoImage} onChange={(e) => setOnlyNoImage(e.target.checked)} />
          Zonder afbeelding
        </label>
        <label className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" checked={onlyNoDesc} onChange={(e) => setOnlyNoDesc(e.target.checked)} />
          Zonder beschrijving
        </label>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-muted-foreground text-sm">
            {filtered.length} van {rows.length}
            {hasMore ? " (cap 1000)" : ""}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              startTransition(() => {
                router.refresh();
                toast.success("Lijst vernieuwd vanuit Shopify");
              })
            }
          >
            ↻ Vernieuwen
          </Button>
        </div>
      </div>

      {/* Bulk-balk */}
      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-2 text-sm">
          <span className="font-medium">{selected.size} geselecteerd</span>
          <span className="mx-1 h-4 w-px bg-border" />
          <Input
            placeholder="tag…"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            className="h-8 w-28"
          />
          <Button size="sm" variant="outline" disabled={pending || !tagInput.trim()} onClick={() => runBulk("Tag toegevoegd", () => bulkAddTags(selectedGids, [tagInput.trim()]))}>
            + tag
          </Button>
          <Button size="sm" variant="outline" disabled={pending || !tagInput.trim()} onClick={() => runBulk("Tag verwijderd", () => bulkRemoveTags(selectedGids, [tagInput.trim()]))}>
            − tag
          </Button>
          <span className="mx-1 h-4 w-px bg-border" />
          <Button size="sm" variant="outline" disabled={pending} onClick={() => runBulk("Geactiveerd", () => bulkSetShopifyStatus(selectedGids, "ACTIVE"))}>
            Activeren
          </Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => runBulk("Op concept", () => bulkSetShopifyStatus(selectedGids, "DRAFT"))}>
            Op concept
          </Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => runBulk("Gepubliceerd naar storefront", () => bulkPublishToStorefront(selectedGids))}>
            → Storefront
          </Button>
          <span className="mx-1 h-4 w-px bg-border" />
          <Button size="sm" variant="outline" disabled={pending} onClick={() => runBulk("SEO gemarkeerd", () => bulkMarkSeoToImprove(selectedGids))}>
            SEO te verbeteren
          </Button>
          <select
            disabled={pending}
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value as OptStatus | "";
              if (v) runBulk("Status gezet", () => bulkSetOptStatus(selectedGids, v));
              e.target.value = "";
            }}
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs"
          >
            <option value="">Opt-status zetten…</option>
            {Object.entries(OPT_STATUS_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
          <span className="mx-1 h-4 w-px bg-border" />
          <Button size="sm" variant="secondary" onClick={exportCsv}>
            Export CSV
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={exportCsv}>
            Export CSV ({filtered.length})
          </Button>
        </div>
      )}

      {/* Tabel */}
      <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted/60 text-muted-foreground text-left text-xs uppercase tracking-wide">
              <th className="w-9 px-3 py-2.5">
                <input type="checkbox" checked={allFilteredSelected} onChange={toggleAllFiltered} title="Selecteer alle (gefilterd)" />
              </th>
              <th className="w-12 px-2 py-2.5"></th>
              <th className="cursor-pointer px-3 py-2.5 font-medium select-none" onClick={() => toggleSort("title")}>Titel{sortArrow("title")}</th>
              {isReview ? (
                <th className="px-3 py-2.5 font-medium" title="Heeft het product een foto en een beschrijving?">Compleet</th>
              ) : (
                <>
                  <th className="px-3 py-2.5 font-medium" title="Artikelnummer (SKU)">SKU</th>
                  <th className="cursor-pointer px-3 py-2.5 font-medium select-none" onClick={() => toggleSort("cost")} title="Inkoopprijs — jouw kostprijs">Inkoop{sortArrow("cost")}</th>
                  <th className="cursor-pointer px-3 py-2.5 font-medium select-none" onClick={() => toggleSort("price")} title="Verkoopprijs in de winkel">Prijs{sortArrow("price")}</th>
                  <th className="px-3 py-2.5 font-medium" title="Adviesprijs / doorgestreepte vergelijkprijs">Advies</th>
                  <th className="cursor-pointer px-3 py-2.5 font-medium select-none" onClick={() => toggleSort("margin")} title="Winstmarge t.o.v. de verkoopprijs (negatief = verlies)">Marge{sortArrow("margin")}</th>
                  <th className="cursor-pointer px-3 py-2.5 font-medium select-none" onClick={() => toggleSort("inventory")} title="Voorraad in stuks">Voorraad{sortArrow("inventory")}</th>
                </>
              )}
              <th className="cursor-pointer px-3 py-2.5 font-medium select-none" onClick={() => toggleSort("status")} title="Zichtbaarheid in Shopify">Status{sortArrow("status")}</th>
              <th className="px-3 py-2.5 font-medium" title="AI/controle-fase van dit product">Controle</th>
              <th className="cursor-pointer px-3 py-2.5 font-medium select-none" onClick={() => toggleSort("updated")}>Bijgewerkt{sortArrow("updated")}</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={r.id} className="hover:bg-accent/40 border-t border-border/60 transition-colors">
                <td className="px-3 py-2">
                  <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                </td>
                <td className="px-2 py-2">
                  {r.image?.url ? (
                    <Image src={r.image.url} alt={r.image.altText ?? r.title} width={36} height={36} className="h-9 w-9 rounded object-cover ring-1 ring-foreground/10" />
                  ) : (
                    <div className="bg-muted text-muted-foreground flex h-9 w-9 items-center justify-center rounded text-[9px]">geen</div>
                  )}
                </td>
                <td className="px-3 py-2">
                  <Link href={`/admin/products/${r.numericId}`} className="font-medium hover:underline">{r.title}</Link>
                </td>
                {isReview ? (
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2 text-xs">
                      <CompleetChip ok={r.hasImage} okLabel="Foto" missLabel="Geen foto" MissIcon={ImageOff} />
                      <CompleetChip ok={r.hasDescription} okLabel="Tekst" missLabel="Geen tekst" MissIcon={FileWarning} />
                    </div>
                  </td>
                ) : (
                  <>
                    <td className="text-muted-foreground px-3 py-2 whitespace-nowrap tabular-nums">{r.sku ?? "—"}</td>
                    <td className="text-muted-foreground px-3 py-2 whitespace-nowrap tabular-nums">{r.unitCost ? formatPrice(r.unitCost) : "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap tabular-nums">{r.minPrice ? formatPrice(r.minPrice) : "—"}</td>
                    <td className="text-muted-foreground px-3 py-2 whitespace-nowrap tabular-nums">{r.adviesprijs ? formatPrice(r.adviesprijs) : "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap tabular-nums" title={r.marginPct == null ? "Geen inkoopprijs bekend" : r.marginPct < 0 ? "Verlies: verkoopprijs onder inkoop" : undefined}>
                      <span className={cn("inline-flex items-center gap-1", marginTone(r.marginPct))}>
                        {r.marginPct != null ? `${r.marginPct}%` : "—"}
                        {r.marginPct != null && r.marginPct < 0 ? <span className="text-[10px] uppercase">verlies</span> : null}
                      </span>
                    </td>
                    <td className="px-3 py-2 tabular-nums">{r.totalInventory}</td>
                  </>
                )}
                <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
                <td className="px-3 py-2"><OptStatusBadge status={r.optStatus} /></td>
                <td className="text-muted-foreground px-3 py-2 whitespace-nowrap tabular-nums">{dateFmt.format(new Date(r.updatedAt))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginatie */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Pagina {safePage + 1} / {pageCount}
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Vorige</Button>
          <Button size="sm" variant="outline" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}>Volgende</Button>
        </div>
      </div>
    </div>
  );
}

/** Klein "compleet?"-chipje voor de review-weergave (foto/tekst aanwezig). */
function CompleetChip({
  ok,
  okLabel,
  missLabel,
  MissIcon,
}: {
  ok: boolean;
  okLabel: string;
  missLabel: string;
  MissIcon: typeof Check;
}) {
  return ok ? (
    <span className="text-teal inline-flex items-center gap-1">
      <Check className="size-3.5" /> {okLabel}
    </span>
  ) : (
    <span className="text-destructive inline-flex items-center gap-1">
      <MissIcon className="size-3.5" /> {missLabel}
    </span>
  );
}
