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
                className="relative h-1 w-full grow overflow-hidden rounded-full bg-primary/20"
            >
                <SliderPrimitive.Range className="absolute h-full bg-primary" />
            </SliderPrimitive.Track>

            <TooltipProvider>
                <Tooltip open={showTooltip && showPreciseValue && tooltipValue !== null}>
                    <TooltipTrigger asChild>
                        <SliderPrimitive.Thumb
                            className={cn(
                                "block h-3 w-3 rounded-full border border-primary/50 bg-background ring-offset-background",
                                "transition-all duration-100 ease-out",
                                "hover:h-4 hover:w-4 hover:border-primary",
                                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                                "disabled:pointer-events-none disabled:opacity-50"
                            )}
                        />
                    </TooltipTrigger>
                    <TooltipContent
                        side="top"
                        align="center"
                        className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded-sm"
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