import { Circle, Settings as SettingsIcon } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/card";

export function ComingSoon({
  label,
  description,
  planned,
  enabled,
}: {
  label: string;
  description: string;
  planned: string[];
  enabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={label}
        description={description}
        badge={
          <span className="bg-brand/20 text-brand-foreground rounded-full px-2.5 py-0.5 text-xs font-medium">
            {enabled ? "Geactiveerd · in ontwikkeling" : "Binnenkort"}
          </span>
        }
      />

      <Card className="max-w-md gap-0 p-5">
        <p className="mb-3 text-sm font-medium">Gepland in deze module</p>
        <ul className="flex flex-col gap-2 text-sm">
          {planned.map((p) => (
            <li key={p} className="text-muted-foreground flex items-center gap-2.5">
              <Circle className="size-3.5 shrink-0 opacity-50" />
              {p}
            </li>
          ))}
        </ul>
      </Card>

      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <SettingsIcon className="size-3.5" />
        Deze module is voorzien in de structuur en wordt geleidelijk geactiveerd.
        De owner kan modules aan/uit zetten bij <strong>Instellingen</strong>.
      </p>
    </div>
  );
}
