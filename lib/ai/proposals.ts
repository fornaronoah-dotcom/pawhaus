import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { aiProposals, type AiProposal } from "@/lib/db/schema";
import type { ProductTextProposal } from "@/lib/ai/optimize-text";

/** Slaat een AI-concept op in Postgres (status pending). */
export async function createProposal(input: {
  shopifyProductGid: string;
  numericId: string;
  fields: ProductTextProposal;
  model: string;
  userId: string | null;
}): Promise<AiProposal> {
  const [row] = await db
    .insert(aiProposals)
    .values({
      shopifyProductGid: input.shopifyProductGid,
      numericId: input.numericId,
      fields: input.fields,
      model: input.model,
      createdBy: input.userId,
      status: "pending",
    })
    .returning();
  return row;
}

export async function getProposal(id: string): Promise<AiProposal | null> {
  const [row] = await db
    .select()
    .from(aiProposals)
    .where(eq(aiProposals.id, id))
    .limit(1);
  return row ?? null;
}

export async function markProposalApplied(
  id: string,
  appliedFields: string[],
): Promise<void> {
  await db
    .update(aiProposals)
    .set({ status: "applied", appliedFields, updatedAt: new Date() })
    .where(eq(aiProposals.id, id));
}

export async function markProposalRejected(id: string): Promise<void> {
  await db
    .update(aiProposals)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(eq(aiProposals.id, id));
}
