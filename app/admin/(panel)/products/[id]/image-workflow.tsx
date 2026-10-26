"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { AdminMedia } from "@/lib/admin-products";
import type { DraftMeta } from "@/lib/admin/media-review";
import {
  publishDraftAction,
  discardDraftAction,
  autoImproveImageAction,
} from "@/lib/admin-image-actions";

const AI_OPS = [
  { key: "background", label: "Achtergrond weg" },
  { key: "upscale", label: "Scherper" },
  { key: "productshot", label: "Productfoto" },
] as const;

type Props = {
  numericId: string;
  shopifyProductGid: string;
  media: AdminMedia[];
  drafts: DraftMeta[];
  imageAiEnabled: boolean;
};

export function ImageWorkflow(props: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [basedOn, setBasedOn] = useState<string>("");
  const [showManual, setShowManual] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Esc sluit de vergrootweergave.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  function aiImprove(m: AdminMedia, op: "background" | "upscale" | "productshot") {
    startTransition(async () => {
      const t = toast.loading(
        op === "productshot"
          ? "AI maakt een productfoto… (±20s)"
          : "AI verbetert de foto…",
      );
      const r = await autoImproveImageAction({
        numericId: props.numericId,
        shopifyProductGid: props.shopifyProductGid,
        originalMediaId: m.id,
        originalUrl: m.url,
        op,
      });
      if (r.ok) {
        toast.success("Klaar — bekijk het resultaat bij 'In review'", { id: t });
        router.refresh();
      } else {
        toast.error(r.error ?? "AI-verbetering mislukt", { id: t });
      }
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
      } else {
        toast.error(r.error ?? "Publiceren mislukt");
      }
      router.refresh();
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
      {/* Intro */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium">Foto&apos;s verbeteren met AI</h3>
          {props.imageAiEnabled ? (
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              ✨ fal.ai actief
            </span>
          ) : null}
        </div>
        <p className="text-muted-foreground text-sm">
          Kies bij een foto <strong>Achtergrond weg</strong> of <strong>Scherper</strong>.
          De AI maakt een voorstel dat je hieronder bij <em>In review</em> ziet (oud vs
          nieuw) en pas na jouw goedkeuring naar Shopify gaat.
        </p>
        {!props.imageAiEnabled ? (
          <div className="rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            fal.ai is niet ingesteld. Voeg <code>FAL_KEY</code> toe aan je
            omgeving en herstart de server om automatische foto&apos;s aan te zetten.
          </div>
        ) : null}
      </section>

      {/* Originele foto's met AI-acties */}
      <section className="flex flex-col gap-3">
        <h3 className="text-base font-medium">Originele Shopify-foto&apos;s</h3>
        {props.media.length === 0 ? (
          <p className="text-muted-foreground text-sm">Geen foto&apos;s.</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {props.media.map((m) => (
              <div key={m.id} className="flex w-40 flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setLightbox(m.url)}
                  className="cursor-zoom-in"
                  title="Klik om groot te bekijken"
                >
                  <Image
                    src={m.url}
                    alt={m.altText ?? ""}
                    width={160}
                    height={160}
                    className="ring-foreground/10 h-40 w-40 rounded-lg object-cover ring-1 transition hover:ring-primary/40"
                  />
                </button>
                {props.imageAiEnabled ? (
                  <div className="flex flex-wrap gap-1">
                    {AI_OPS.map((op) => (
                      <Button
                        key={op.key}
                        size="xs"
                        disabled={pending}
                        onClick={() => aiImprove(m, op.key)}
                        title="Maakt een voorstel dat je daarna goedkeurt"
                      >
                        ✨ {op.label}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    fal.ai niet ingesteld
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Drafts in review (oud vs nieuw) */}
      {openDrafts.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h3 className="text-base font-medium">In review</h3>
          <div className="flex flex-col gap-4">
            {openDrafts.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center gap-4 rounded-lg border p-3">
                {d.originalUrl ? (
                  <figure className="flex flex-col items-center gap-1">
                    <img
                      src={d.originalUrl}
                      alt=""
                      onClick={() => setLightbox(d.originalUrl!)}
                      className="ring-foreground/10 h-28 w-28 cursor-zoom-in rounded object-cover ring-1 transition hover:ring-primary/40"
                    />
                    <figcaption className="text-muted-foreground text-[10px]">oud</figcaption>
                  </figure>
                ) : null}
                <span className="text-muted-foreground">→</span>
                <figure className="flex flex-col items-center gap-1">
                  <img
                    src={`/api/admin/draft-image/${d.id}`}
                    alt=""
                    onClick={() => setLightbox(`/api/admin/draft-image/${d.id}`)}
                    className="ring-primary/40 h-28 w-28 cursor-zoom-in rounded object-cover ring-1 transition hover:ring-primary"
                  />
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

      {/* Gepubliceerd (historiek) */}
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

      {/* Handmatige fallback (ingeklapt) */}
      <section className="flex flex-col gap-2 border-t pt-4">
        <button
          type="button"
          onClick={() => setShowManual((v) => !v)}
          className="text-muted-foreground hover:text-foreground self-start text-xs"
        >
          {showManual ? "− " : "+ "}Of upload zelf een bewerkte foto
        </button>
        {showManual ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="text-sm" />
            <select value={basedOn} onChange={(e) => setBasedOn(e.target.value)} className="border-input h-8 rounded-lg border bg-transparent px-2 text-sm">
              <option value="">Gebaseerd op… (optioneel)</option>
              {props.media.map((m, i) => (
                <option key={m.id} value={i}>Origineel {i + 1}</option>
              ))}
            </select>
            <Button size="sm" disabled={uploading} onClick={handleUpload}>
              {uploading ? "Uploaden…" : "Upload als draft"}
            </Button>
          </div>
        ) : null}
      </section>

      {/* Vergrootweergave (lightbox) */}
      {lightbox ? (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/80 p-6"
          role="dialog"
          aria-modal="true"
        >
          <img
            src={lightbox}
            alt="Vergrote foto"
            className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
          />
          <button
            type="button"
            aria-label="Sluiten"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-5 text-3xl leading-none text-white/80 hover:text-white"
          >
            ×
          </button>
        </div>
      ) : null}
    </div>
  );
}
