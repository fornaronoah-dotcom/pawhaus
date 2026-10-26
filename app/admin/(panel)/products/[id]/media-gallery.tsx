"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ZoomableImage } from "@/components/admin/ZoomableImage";
import { setMainImageAction } from "@/lib/admin-actions";
import type { AdminMedia } from "@/lib/admin-products";

export function MediaGallery({
  numericId,
  media,
}: {
  numericId: string;
  media: AdminMedia[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (media.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Dit product heeft nog geen foto&apos;s.
      </p>
    );
  }

  function makeMain(mediaId: string) {
    startTransition(async () => {
      const r = await setMainImageAction(numericId, mediaId);
      if (r.ok) {
        toast.success("Hoofdafbeelding ingesteld");
        router.refresh();
      } else {
        toast.error(r.error ?? "Kon hoofdafbeelding niet wijzigen");
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-3">
      {media.map((m, i) => (
        <div key={m.id} className="flex w-24 flex-col gap-1">
          <div className="relative">
            <ZoomableImage
              src={m.url}
              alt={m.altText ?? ""}
              width={96}
              height={96}
              className="ring-foreground/10 hover:ring-primary/40 h-24 w-24 rounded-lg object-cover ring-1 transition"
            />
            {i === 0 ? (
              <span className="absolute left-1 top-1 rounded bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                hoofd
              </span>
            ) : null}
          </div>
          {i !== 0 ? (
            <Button
              size="xs"
              variant="outline"
              disabled={pending}
              onClick={() => makeMain(m.id)}
            >
              Maak hoofd
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
