'use client'

import { motion } from "framer-motion"
import { cn } from "@/lib/actions/utils"
import { CheckCircle2 } from "lucide-react"

interface ProgressBarProps {
    steps: string[]
    currentStep?: number
    className?: string
}

export function ProgressBar({ steps, currentStep = 0, className }: ProgressBarProps) {
    return (
        <div className={cn("w-full px-4 py-2", className)}>
            <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                    <div key={step} className="flex items-center">
                        <div className="relative">
                            {/* Step circle */}
                            <motion.div
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center border-2",
                                    index <= currentStep
                                        ? "border-[#D73D57] bg-[#D73D57]/10"
                                        : "border-border bg-background"
                                )}
                                initial={false}
                                animate={{
                                    scale: index === currentStep ? [1, 1.1, 1] : 1
                                }}
                                transition={{ duration: 0.5, repeat: index === currentStep ? Infinity : 0 }}
                            >
                                {index < currentStep ? (
                                    <CheckCircle2 className="w-4 h-4 text-[#D73D57]" />
                                ) : (
                                    <span className={cn(
                                        "text-sm",
                                        index <= currentStep ? "text-[#D73D57]" : "text-muted-foreground"
                                    )}>
                                        {index + 1}
                                    </span>
                                )}
                            </motion.div>

                            {/* Step label */}
                            <span className={cn(
                                "absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap",
                                index <= currentStep ? "text-foreground" : "text-muted-foreground"
                            )}>
                                {step}
                            </span>
                        </div>

                        {/* Connector line */}
                        {index < steps.length - 1 && (
                            <div className="w-full mx-2 h-[2px] bg-border">
                                <motion.div
                                    className="h-full bg-[#D73D57]"
                                    initial={{ width: "0%" }}
                                    animate={{ width: index < currentStep ? "100%" : "0%" }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
} 