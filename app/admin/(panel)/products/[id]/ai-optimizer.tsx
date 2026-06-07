"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  generateProposalAction,
  applyProposalAction,
  rejectProposalAction,
} from "@/lib/admin-ai-actions";
import type { ProductTextProposal } from "@/lib/ai/optimize-text";

type Original = {
  title: string;
  descriptionHtml: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
};

const FIELD_DEFS: { key: keyof ProductTextProposal; label: string; html?: boolean }[] = [
  { key: "title", label: "Titel" },
  { key: "descriptionHtml", label: "Beschrijving", html: true },
  { key: "seoTitle", label: "SEO-titel" },
  { key: "metaDescription", label: "Meta-omschrijving" },
  { key: "tags", label: "Tags" },
];

export function AiOptimizer({
  numericId,
  aiConfigured,
  original,
}: {
  numericId: string;
  aiConfigured: boolean;
  original: Original;
}) {
  const router = useRouter();
  const [generating, startGenerate] = useTransition();
  const [applying, startApply] = useTransition();
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [fields, setFields] = useState<ProductTextProposal | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function origValue(key: keyof ProductTextProposal): string {
    if (key === "metaDescription") return original.seoDescription;
    if (key === "tags") return original.tags.join(", ");
    return (original[key as keyof Original] as string) ?? "";
  }
  function nextValue(key: keyof ProductTextProposal): string {
    if (!fields) return "";
    return key === "tags" ? fields.tags.join(", ") : (fields[key] as string);
  }

  function generate() {
    startGenerate(async () => {
      const res = await generateProposalAction(numericId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setProposalId(res.proposalId);
      setFields(res.fields);
      setSelected(new Set(FIELD_DEFS.map((f) => f.key))); // standaard alles aan
      toast.success("AI-concept gemaakt — controleer en keur goed");
    });
  }

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function apply() {
    if (!proposalId || selected.size === 0) return;
    startApply(async () => {
      const res = await applyProposalAction(proposalId, [...selected]);
      if (res.ok) {
        toast.success("Toegepast op Shopify");
        setProposalId(null);
        setFields(null);
        router.refresh();
      } else {
        toast.error(res.error ?? "Toepassen mislukt");
      }
    });
  }

  function reject() {
    if (!proposalId) return;
    startApply(async () => {
      await rejectProposalAction(proposalId);
      setProposalId(null);
      setFields(null);
      toast.success("Concept verworpen");
    });
  }

  if (!aiConfigured) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        AI nog niet geconfigureerd — stel <code>GEMINI_API_KEY</code> in{" "}
        <code>.env.local</code> in.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {!fields ? (
        <div>
          <Button onClick={generate} disabled={generating}>
            {generating ? "Bezig met genereren…" : "Genereer AI-voorstel (Gemini)"}
          </Button>
          <p className="text-muted-foreground mt-2 text-xs">
            De AI maakt enkel een concept. Niets wordt naar Shopify geschreven
            tot jij hieronder velden selecteert en op &quot;Toepassen&quot; klikt.
          </p>
        </div>
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            Vink de velden aan die je wil overnemen, controleer ze, en klik
            daarna <strong>Toepassen op Shopify</strong>.
          </p>

          <div className="flex flex-col gap-4">
            {FIELD_DEFS.map((f) => {
              const orig = origValue(f.key);
              const next = nextValue(f.key);
              const on = selected.has(f.key);
              return (
                <div
                  key={f.key}
                  className={`rounded-lg border p-3 ${on ? "border-primary/40 bg-primary/[0.03]" : ""}`}
                >
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <input type="checkbox" checked={on} onChange={() => toggle(f.key)} />
                    {f.label}
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-muted-foreground mb-1 text-xs">Origineel</p>
                      {f.html ? (
                        <div className="prose prose-sm max-w-none rounded border bg-muted/30 p-2 text-xs" dangerouslySetInnerHTML={{ __html: orig || "<em>leeg</em>" }} />
                      ) : (
                        <p className="rounded border bg-muted/30 p-2 text-xs whitespace-pre-wrap">{orig || "—"}</p>
                      )}
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-primary">AI-voorstel</p>
                      {f.html ? (
                        <div className="prose prose-sm max-w-none rounded border border-primary/30 p-2 text-xs" dangerouslySetInnerHTML={{ __html: next || "<em>leeg</em>" }} />
                      ) : (
                        <p className="rounded border border-primary/30 p-2 text-xs whitespace-pre-wrap">{next || "—"}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={apply} disabled={applying || selected.size === 0}>
              {applying ? "Bezig…" : `Toepassen op Shopify (${selected.size})`}
            </Button>
            <Button variant="outline" onClick={reject} disabled={applying}>
              Verwerp
            </Button>
            <Button variant="ghost" onClick={generate} disabled={generating}>
              Opnieuw genereren
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
