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
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{label}</h1>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            {enabled ? "Geactiveerd · in ontwikkeling" : "Binnenkort"}
          </span>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      </div>

      <div className="max-w-md rounded-xl border bg-card p-5">
        <p className="mb-2 text-sm font-medium">Gepland in deze module</p>
        <ul className="text-muted-foreground flex flex-col gap-1 text-sm">
          {planned.map((p) => (
            <li key={p} className="flex items-center gap-2">
              <span className="text-muted-foreground/50">○</span>
              {p}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-muted-foreground text-xs">
        Deze module is voorzien in de structuur en wordt geleidelijk geactiveerd.
        De owner kan modules aan/uit zetten bij <strong>Instellingen</strong>.
      </p>
    </div>
  );
}
