import type { ReactNode } from "react";
import {
  Info,
  TriangleAlert,
  CircleAlert,
  CircleCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "info" | "warning" | "error" | "success";

const VARIANTS: Record<
  Variant,
  { box: string; icon: LucideIcon; iconColor: string }
> = {
  info: {
    box: "border-sky/30 bg-sky/5 text-foreground",
    icon: Info,
    iconColor: "text-sky",
  },
  warning: {
    box: "border-brand/40 bg-brand/10 text-foreground",
    icon: TriangleAlert,
    iconColor: "text-brand-foreground",
  },
  error: {
    box: "border-destructive/30 bg-destructive/5 text-destructive",
    icon: CircleAlert,
    iconColor: "text-destructive",
  },
  success: {
    box: "border-teal/30 bg-teal/5 text-foreground",
    icon: CircleCheck,
    iconColor: "text-teal",
  },
};

/**
 * Uniforme meldingsbox (info/waarschuwing/fout/succes). Vervangt de losse,
 * ad-hoc `bg-destructive/5` en `bg-amber-50` blokken zodat alle meldingen in
 * het paneel dezelfde stijl en design-tokens delen.
 */
export function Callout({
  variant = "info",
  title,
  children,
  className,
}: {
  variant?: Variant;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const { box, icon: Icon, iconColor } = VARIANTS[variant];
  return (
    <div
      role={variant === "error" || variant === "warning" ? "alert" : undefined}
      className={cn(
        "flex gap-3 rounded-xl border p-4 text-sm",
        box,
        className,
      )}
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", iconColor)} />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-1")}>{children}</div>}
      </div>
    </div>
  );
}
