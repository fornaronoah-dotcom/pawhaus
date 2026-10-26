"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { markNewProductDoneAction } from "@/lib/admin-actions";

export function MarkDoneButton({
  gid,
  numericId,
}: {
  gid: string;
  numericId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const r = await markNewProductDoneAction(gid, numericId);
          if (r.ok) {
            toast.success("Gemarkeerd als afgewerkt");
            router.refresh();
          } else {
            toast.error(r.error ?? "Mislukt");
          }
        })
      }
    >
      <Check className="size-4" />
      Markeer afgewerkt
    </Button>
  );
}
