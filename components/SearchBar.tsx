"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SearchBar({
  className,
  autoFocus,
}: {
  className?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = String(formData.get("search") ?? "").trim();
    router.push(query ? `/producten?search=${encodeURIComponent(query)}` : "/producten");
  }

  return (
    <form onSubmit={onSubmit} className={cn("relative", className)} role="search">
      <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
      <Input
        type="search"
        name="search"
        defaultValue={searchParams.get("search") ?? ""}
        placeholder="Zoek producten…"
        aria-label="Zoek producten"
        autoFocus={autoFocus}
        className="pl-9"
      />
    </form>
  );
}
