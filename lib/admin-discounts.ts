import "server-only";

import { shopifyAdminFetch } from "@/lib/shopify-admin";
import { ShopifyError } from "@/lib/shopify";
import {
  DISCOUNT_LIST_QUERY,
  DISCOUNT_CREATE_MUTATION,
} from "@/lib/admin-discount-queries";
import type { Money } from "@/lib/types";

/**
 * Kortingscodes via de Shopify Admin API. Shopify blijft bron van waarheid;
 * wij maken alleen codes aan en lezen ze terug.
 */

export type DiscountStatus = "ACTIVE" | "EXPIRED" | "SCHEDULED";

export type AdminDiscount = {
  id: string;
  title: string;
  code: string;
  status: DiscountStatus;
  type: "percentage" | "amount";
  /** percentage als heel getal (10 = 10%), of bedrag (Money) */
  percentage: number | null;
  amount: Money | null;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  usageCount: number;
  oncePerCustomer: boolean;
};

/** Foutklasse om ontbrekende scope herkenbaar te maken in de UI. */
export class DiscountScopeError extends Error {
  constructor() {
    super("De Shopify-app mist de scope write_discounts.");
    this.name = "DiscountScopeError";
  }
}

function isAccessDenied(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /access denied|not approved|write_discounts|read_discounts/i.test(msg);
}

/* ------------------------------- lees-API ------------------------------ */

type RawValue =
  | { __typename: "DiscountPercentage"; percentage: number }
  | { __typename: "DiscountAmount"; amount: Money };

type RawNode = {
  id: string;
  codeDiscount: {
    __typename: string;
    title?: string;
    status?: DiscountStatus;
    startsAt?: string | null;
    endsAt?: string | null;
    usageLimit?: number | null;
    asyncUsageCount?: number;
    appliesOncePerCustomer?: boolean;
    codes?: { nodes: { code: string }[] };
    customerGets?: { value: RawValue };
  };
};

export async function listDiscounts(first = 100): Promise<AdminDiscount[]> {
  let data;
  try {
    data = await shopifyAdminFetch<{
      codeDiscountNodes: { edges: { node: RawNode }[] };
    }>({ query: DISCOUNT_LIST_QUERY, variables: { first } });
  } catch (err) {
    if (err instanceof ShopifyError && isAccessDenied(err)) {
      throw new DiscountScopeError();
    }
    throw err;
  }

  const out: AdminDiscount[] = [];
  for (const { node } of data.codeDiscountNodes.edges) {
    const d = node.codeDiscount;
    if (d.__typename !== "DiscountCodeBasic") continue; // alleen basis-codes
    const value = d.customerGets?.value;
    const isPct = value?.__typename === "DiscountPercentage";
    out.push({
      id: node.id,
      title: d.title ?? "",
      code: d.codes?.nodes[0]?.code ?? "",
      status: d.status ?? "ACTIVE",
      type: isPct ? "percentage" : "amount",
      percentage: isPct ? Math.round((value as { percentage: number }).percentage * 100) : null,
      amount: !isPct && value?.__typename === "DiscountAmount" ? value.amount : null,
      startsAt: d.startsAt ?? null,
      endsAt: d.endsAt ?? null,
      usageLimit: d.usageLimit ?? null,
      usageCount: d.asyncUsageCount ?? 0,
      oncePerCustomer: Boolean(d.appliesOncePerCustomer),
    });
  }
  return out;
}

/* ------------------------------ schrijf-API ---------------------------- */

export type CreateDiscountInput = {
  title: string;
  code: string;
  type: "percentage" | "amount";
  /** percentage in hele procenten (10 = 10%) of bedrag (bv. "5.00") */
  value: string;
  endsAt?: string | null;
  usageLimit?: number | null;
  oncePerCustomer?: boolean;
};

export type CreateDiscountResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createBasicDiscount(
  input: CreateDiscountInput,
): Promise<CreateDiscountResult> {
  const customerGets =
    input.type === "percentage"
      ? { value: { percentage: Number(input.value) / 100 }, items: { all: true } }
      : {
          value: { discountAmount: { amount: input.value, appliesOnEachItem: false } },
          items: { all: true },
        };

  const basicCodeDiscount: Record<string, unknown> = {
    title: input.title,
    code: input.code,
    startsAt: new Date().toISOString(),
    customerSelection: { all: true },
    customerGets,
    appliesOncePerCustomer: Boolean(input.oncePerCustomer),
  };
  if (input.endsAt) basicCodeDiscount.endsAt = input.endsAt;
  if (input.usageLimit && input.usageLimit > 0)
    basicCodeDiscount.usageLimit = input.usageLimit;

  let data;
  try {
    data = await shopifyAdminFetch<{
      discountCodeBasicCreate: {
        codeDiscountNode: { id: string } | null;
        userErrors: { field: string[] | null; message: string }[];
      };
    }>({ query: DISCOUNT_CREATE_MUTATION, variables: { basicCodeDiscount } });
  } catch (err) {
    if (err instanceof ShopifyError && isAccessDenied(err)) {
      return { ok: false, error: "De Shopify-app mist de scope write_discounts." };
    }
    return { ok: false, error: err instanceof Error ? err.message : "Fout." };
  }

  const { codeDiscountNode, userErrors } = data.discountCodeBasicCreate;
  if (userErrors.length)
    return { ok: false, error: userErrors.map((e) => e.message).join("; ") };
  if (!codeDiscountNode) return { ok: false, error: "Shopify gaf geen korting terug." };
  return { ok: true, id: codeDiscountNode.id };
}
