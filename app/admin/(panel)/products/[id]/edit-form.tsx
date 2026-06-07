"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import {
  updateProductAction,
  type ProductUpdateState,
} from "@/lib/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichText } from "@/components/ui/rich-text";

type Props = {
  numericId: string;
  title: string;
  descriptionHtml: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
    </div>
  );
}

export function EditForm(props: Props) {
  const [state, formAction, pending] = useActionState<
    ProductUpdateState,
    FormData
  >(updateProductAction, {});

  useEffect(() => {
    if (state.ok) toast.success("Opgeslagen in Shopify");
    else if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="numericId" value={props.numericId} />

      <Field label="Titel">
        <Input name="title" defaultValue={props.title} required />
      </Field>

      <Field
        label="Beschrijving"
        hint="Rich text — wordt als HTML in Shopify opgeslagen."
      >
        <RichText name="descriptionHtml" defaultValue={props.descriptionHtml} />
      </Field>

      <Field label="Tags" hint="Gescheiden door komma's, bv. nieuw-product, hond, leren">
        <Input name="tags" defaultValue={props.tags.join(", ")} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="SEO-titel">
          <Input name="seoTitle" defaultValue={props.seoTitle} />
        </Field>
        <Field label="Meta-omschrijving">
          <Input name="seoDescription" defaultValue={props.seoDescription} />
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Opslaan…" : "Opslaan naar Shopify"}
        </Button>
        {state.error ? (
          <span className="text-destructive text-sm">{state.error}</span>
        ) : null}
      </div>
    </form>
  );
}
