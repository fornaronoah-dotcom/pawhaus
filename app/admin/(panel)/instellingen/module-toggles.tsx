"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { toggleModuleAction } from "@/lib/admin-settings-actions";
import { MODULES, type FeatureKey } from "@/lib/admin/nav";

export function ModuleToggles({
  flags,
  canEdit,
}: {
  flags: Record<FeatureKey, boolean>;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle(key: FeatureKey, enabled: boolean) {
    startTransition(async () => {
      await toggleModuleAction(key, enabled);
      toast.success(`${MODULES[key].label} ${enabled ? "geactiveerd" : "gedeactiveerd"}`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col divide-y rounded-xl border">
      {(Object.keys(MODULES) as FeatureKey[]).map((key) => (
        <div key={key} className="flex items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-sm font-medium">{MODULES[key].label}</p>
            <p className="text-muted-foreground text-xs">{MODULES[key].description}</p>
          </div>
          <label className="flex shrink-0 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={flags[key]}
              disabled={!canEdit || pending}
              onChange={(e) => toggle(key, e.target.checked)}
            />
            {flags[key] ? "Aan" : "Uit"}
          </label>
        </div>
      ))}
    </div>
  );
}
