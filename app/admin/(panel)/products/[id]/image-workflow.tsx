"use client";

/* eslint-disable @next/next/no-img-element */
import { useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generatePrompts } from "@/lib/admin/image-prompt";
import type { AdminMedia } from "@/lib/admin-products";
import type { DraftMeta } from "@/lib/admin/media-review";
import {
  markSentToFlowAction,
  unmarkSentToFlowAction,
  publishDraftAction,
  discardDraftAction,
} from "@/lib/admin-image-actions";

const FLOW_URL = "https://labs.google/fx/nl/tools/flow";

type Props = {
  numericId: string;
  shopifyProductGid: string;
  title: string;
  productType: string;
  tags: string[];
  media: AdminMedia[];
  flowSent: string[];
  drafts: DraftMeta[];
};

export function ImageWorkflow(props: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [basedOn, setBasedOn] = useState<string>(""); // index van origineel
  const fileRef = useRef<HTMLInputElement>(null);

  const prompts = useMemo(
    () =>
      generatePrompts({
        title: props.title,
        productType: props.productType,
        tags: props.tags,
      }),
    [props.title, props.productType, props.tags],
  );
  const flowSentSet = useMemo(() => new Set(props.flowSent), [props.flowSent]);

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(
      () => toast.success("Prompt gekopieerd"),
      () => toast.error("Kopiëren mislukt"),
    );
  }

  function toggleFlow(m: AdminMedia) {
    startTransition(async () => {
      if (flowSentSet.has(m.id)) {
        await unmarkSentToFlowAction(m.id, props.numericId);
      } else {
        await markSentToFlowAction(props.shopifyProductGid, m.id, props.numericId);
        toast.success("Gemarkeerd als naar Google Flow");
      }
      router.refresh();
    });
  }

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Kies eerst een bestand");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    fd.append("numericId", props.numericId);
    fd.append("shopifyProductGid", props.shopifyProductGid);
    if (basedOn !== "") {
      const orig = props.media[Number(basedOn)];
      if (orig) {
        fd.append("originalMediaId", orig.id);
        fd.append("originalUrl", orig.url);
      }
    }
    setUploading(true);
    try {
      const res = await fetch("/api/admin/image-drafts", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload mislukt");
      toast.success("Draft geüpload — wacht op goedkeuring");
      if (fileRef.current) fileRef.current.value = "";
      setBasedOn("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload mislukt");
    } finally {
      setUploading(false);
    }
  }

  function publish(draftId: string, asMain: boolean) {
    startTransition(async () => {
      const r = await publishDraftAction(draftId, asMain);
      if (r.ok) {
        toast.success(asMain ? "Ingesteld als hoofdafbeelding" : "Toegevoegd als extra afbeelding");
        router.refresh();
      } else {
        toast.error(r.error ?? "Publiceren mislukt");
        router.refresh();
      }
    });
  }

  function discard(draftId: string) {
    startTransition(async () => {
      await discardDraftAction(draftId, props.numericId);
      toast.success("Draft verwijderd");
      router.refresh();
    });
  }

  const openDrafts = props.drafts.filter((d) => d.status === "draft");
  const doneDrafts = props.drafts.filter((d) => d.status !== "draft");

  return (
    <div className="flex flex-col gap-8">
      {/* 1. AI-prompts + Flow openen */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium">AI-prompts voor Google Flow</h3>
          <a href={FLOW_URL} target="_blank" rel="noreferrer">
            <Button size="sm">Open Google Flow ↗</Button>
          </a>
        </div>
        <p className="text-muted-foreground text-sm">
          Download een originele foto, open Google Flow, plak één van deze prompts
          met de foto erbij, en upload het resultaat hieronder. Het product blijft
          identiek — alleen de achtergrond verandert.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {prompts.map((p) => (
            <div key={p.key} className="flex flex-col gap-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{p.label}</span>
                <Button size="xs" variant="outline" onClick={() => copy(p.prompt)}>
                  Kopieer
                </Button>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">{p.prompt}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Originele foto's */}
      <section className="flex flex-col gap-3">
        <h3 className="text-base font-medium">Originele Shopify-foto&apos;s</h3>
        {props.media.length === 0 ? (
          <p className="text-muted-foreground text-sm">Geen foto&apos;s.</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {props.media.map((m) => {
              const sent = flowSentSet.has(m.id);
              return (
                <div key={m.id} className="flex w-40 flex-col gap-2">
                  <div className="relative">
                    <Image src={m.url} alt={m.altText ?? ""} width={160} height={160} className="h-40 w-40 rounded-lg object-cover ring-1 ring-foreground/10" />
                    {sent ? (
                      <span className="absolute left-1 top-1 rounded bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                        → Flow
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <a href={`${m.url}${m.url.includes("?") ? "&" : "?"}width=2048`} download target="_blank" rel="noreferrer">
                      <Button size="xs" variant="outline">Download</Button>
                    </a>
                    <Button size="xs" variant="outline" onClick={() => copy(prompts[0].prompt)}>
                      Kopieer prompt
                    </Button>
                  </div>
                  <Button size="xs" variant={sent ? "secondary" : "ghost"} disabled={pending} onClick={() => toggleFlow(m)}>
                    {sent ? "✓ naar Flow" : "Markeer naar Flow"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Resultaat uploaden */}
      <section className="flex flex-col gap-3">
        <h3 className="text-base font-medium">Bewerkt resultaat uploaden (draft)</h3>
        <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="text-sm" />
          <select value={basedOn} onChange={(e) => setBasedOn(e.target.value)} className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm">
            <option value="">Gebaseerd op… (optioneel)</option>
            {props.media.map((m, i) => (
              <option key={m.id} value={i}>Origineel {i + 1}</option>
            ))}
          </select>
          <Button size="sm" disabled={uploading} onClick={handleUpload}>
            {uploading ? "Uploaden…" : "Upload als draft"}
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          Drafts worden NIET automatisch gepubliceerd. Jij keurt elke foto goed.
        </p>
      </section>

      {/* 4. Drafts in review (oud vs nieuw) */}
      {openDrafts.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h3 className="text-base font-medium">In review</h3>
          <div className="flex flex-col gap-4">
            {openDrafts.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center gap-4 rounded-lg border p-3">
                {d.originalUrl ? (
                  <figure className="flex flex-col items-center gap-1">
                    <img src={d.originalUrl} alt="" className="h-28 w-28 rounded object-cover ring-1 ring-foreground/10" />
                    <figcaption className="text-muted-foreground text-[10px]">oud</figcaption>
                  </figure>
                ) : null}
                <span className="text-muted-foreground">→</span>
                <figure className="flex flex-col items-center gap-1">
                  <img src={`/api/admin/draft-image/${d.id}`} alt="" className="h-28 w-28 rounded object-cover ring-1 ring-primary/40" />
                  <figcaption className="text-muted-foreground text-[10px]">nieuw</figcaption>
                </figure>
                <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                  <Button size="sm" disabled={pending} onClick={() => publish(d.id, false)}>
                    Gebruik als extra afbeelding
                  </Button>
                  <Button size="sm" variant="secondary" disabled={pending} onClick={() => publish(d.id, true)}>
                    Gebruik als hoofdafbeelding
                  </Button>
                  <Button size="sm" variant="ghost" disabled={pending} onClick={() => discard(d.id)}>
                    Verwijderen
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* 5. Gepubliceerde drafts (historiek) */}
      {doneDrafts.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-base font-medium">Gepubliceerd</h3>
          <ul className="text-muted-foreground flex flex-col gap-1 text-sm">
            {doneDrafts.map((d) => (
              <li key={d.id}>
                {d.filename} —{" "}
                {d.status === "published_main" ? "hoofdafbeelding" : "extra afbeelding"}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
