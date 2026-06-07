"use client";

import * as React from "react";
import { Slider as SliderPrimitive } from "@base-ui/react/slider";

import { cn } from "@/lib/utils";

/** Range-slider (twee thumbs) voor o.a. prijsfilter. `value` = [min, max]. */
function Slider({ className, ...props }: SliderPrimitive.Root.Props) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn("relative w-full select-none", className)}
      {...props}
    >
      <SliderPrimitive.Control className="flex w-full touch-none items-center py-2">
        <SliderPrimitive.Track className="relative h-1.5 w-full rounded-full bg-[#0C2A5A]/12">
          <SliderPrimitive.Indicator className="rounded-full bg-[#e0533f]" />
          <SliderPrimitive.Thumb
            index={0}
            className="focus-visible:ring-ring/50 size-4 rounded-full border-2 border-[#e0533f] bg-white shadow outline-none focus-visible:ring-2"
          />
          <SliderPrimitive.Thumb
            index={1}
            className="focus-visible:ring-ring/50 size-4 rounded-full border-2 border-[#e0533f] bg-white shadow outline-none focus-visible:ring-2"
          />
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
