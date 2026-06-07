"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";

/**
 * Toont een QR-code voor de kortingslink (https://site/discount/CODE).
 * Klanten die de QR scannen krijgen de code automatisch toegepast.
 */
export function QrButton({ code, baseUrl }: { code: string; baseUrl: string }) {
  const [open, setOpen] = useState(false);
  const url = `${baseUrl.replace(/\/$/, "")}/discount/${encodeURIComponent(code)}`;

  return (
    <div className="relative inline-block">
      <Button size="xs" variant="outline" onClick={() => setOpen((v) => !v)}>
        QR
      </Button>
      {open ? (
        <div className="absolute right-0 z-10 mt-1 flex flex-col items-center gap-2 rounded-lg border bg-card p-3 shadow-lg">
          <QRCodeSVG value={url} size={140} />
          <a href={url} target="_blank" rel="noreferrer" className="text-primary max-w-40 truncate text-xs hover:underline">
            {url}
          </a>
          <Button size="xs" variant="ghost" onClick={() => setOpen(false)}>
            Sluiten
          </Button>
        </div>
      ) : null}
    </div>
  );
}
