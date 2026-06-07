"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">
        Er ging iets mis
      </h1>
      <p className="text-muted-foreground text-sm">
        Onze excuses, er is een onverwachte fout opgetreden. Probeer het
        opnieuw.
      </p>
      <Button onClick={reset}>Opnieuw proberen</Button>
    </div>
  );
}
