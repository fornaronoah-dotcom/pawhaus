"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setOptStatusAction } from "@/lib/admin-actions";
import { OPT_STATUS_LABELS } from "@/lib/admin/opt-status";
import type { OptStatus } from "@/lib/db/schema";

export function OptStatusSelect({
  numericId,
  current,
}: {
  numericId: string;
  current: OptStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={current}
      disabled={pending}
      onChange={(e) => {
        const status = e.target.value as OptStatus;
        startTransition(async () => {
          await setOptStatusAction(numericId, status);
          toast.success("Optimalisatie-status bijgewerkt");
          router.refresh();
        });
      }}
      className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
    >
      {Object.entries(OPT_STATUS_LABELS).map(([k, label]) => (
        <option key={k} value={k}>
          {label}
        </option>
      ))}
    </select>
  );
}
