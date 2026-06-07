"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type QuantitySelectorProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
};

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  className,
}: QuantitySelectorProps) {
  const set = (next: number) => {
    if (disabled) return;
    onChange(Math.min(max, Math.max(min, next)));
  };

  return (
    <div
      className={cn(
        "border-border inline-flex items-center rounded-lg border",
        disabled && "opacity-50",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Aantal verlagen"
        onClick={() => set(value - 1)}
        disabled={disabled || value <= min}
        className="hover:bg-muted flex size-9 items-center justify-center rounded-l-lg transition-colors disabled:pointer-events-none disabled:opacity-40"
      >
        <Minus className="size-4" />
      </button>
      <span className="w-10 text-center text-sm tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label="Aantal verhogen"
        onClick={() => set(value + 1)}
        disabled={disabled || value >= max}
        className="hover:bg-muted flex size-9 items-center justify-center rounded-r-lg transition-colors disabled:pointer-events-none disabled:opacity-40"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
