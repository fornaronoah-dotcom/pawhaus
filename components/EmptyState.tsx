import Link from "next/link";
import { PackageOpen } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: { label: string; href: string };
};

export function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#0C2A5A]/15 bg-[#0C2A5A]/[0.02] px-6 py-16 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-[#e0533f]/10 text-[#e0533f]">
        {icon ?? <PackageOpen className="size-6" />}
      </div>
      <h2 className="text-lg font-semibold text-[#0C2A5A]">{title}</h2>
      {description && (
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          {description}
        </p>
      )}
      {action && (
        <Link href={action.href} className={buttonVariants({ className: "mt-6" })}>
          {action.label}
        </Link>
      )}
    </div>
  );
}
