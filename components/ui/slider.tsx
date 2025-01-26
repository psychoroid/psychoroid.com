"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/actions/utils"

interface ExtendedSliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
    showTooltip?: boolean;
    formatTooltip?: (value: number) => string;
}

const Slider = React.forwardRef<
    React.ElementRef<typeof SliderPrimitive.Root>,
    ExtendedSliderProps
>(({ className, showTooltip = true, formatTooltip, ...props }, ref) => {
    const [tooltipValue, setTooltipValue] = React.useState<number | null>(null);
    const [showPreciseValue, setShowPreciseValue] = React.useState(false);

    const handleValueChange = (values: number[]) => {
        setTooltipValue(values[0]);
        props.onValueChange?.(values);
    };

    const formatValue = (value: number) => {
        if (formatTooltip) return formatTooltip(value);
        return value.toFixed(1);
    };

    return (
        <SliderPrimitive.Root
            ref={ref}
            onValueChange={handleValueChange}
            onMouseEnter={() => setShowPreciseValue(true)}
            onMouseLeave={() => setShowPreciseValue(false)}
            className={cn(
                "relative flex w-full touch-none select-none items-center",
                className
            )}
            {...props}
        >
            <SliderPrimitive.Track
                className="relative h-1 w-full grow overflow-hidden rounded-none bg-zinc-200/20 dark:bg-zinc-600/20"
            >
                <SliderPrimitive.Range className="absolute h-full bg-zinc-500/50 dark:bg-zinc-400" />
            </SliderPrimitive.Track>

            <TooltipProvider>
                <Tooltip open={showTooltip && showPreciseValue && tooltipValue !== null}>
                    <TooltipTrigger asChild>
                        <SliderPrimitive.Thumb
                            className={cn(
                                "block h-2 w-2 rounded-none bg-zinc-500/50 dark:bg-zinc-400",
                                "transition-all duration-100 ease-out",
                                "hover:h-3 hover:w-3",
                                "focus-visible:outline-none",
                                "disabled:pointer-events-none disabled:opacity-50"
                            )}
                        />
                    </TooltipTrigger>
                    <TooltipContent
                        side="top"
                        align="center"
                        className="px-2 py-1 text-xs bg-transparent border-0 shadow-none"
                    >
                        {tooltipValue !== null && formatValue(tooltipValue)}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </SliderPrimitive.Root>
    )
});

Slider.displayName = SliderPrimitive.Root.displayName

export { Slider } 