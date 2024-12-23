'use client'

import { useState } from "react"
import { Wand2, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import RippleButton from "@/components/ui/magic/ripple-button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/actions/utils"

interface RemeshButtonProps {
    isOpen: boolean;
    onClick: () => void;
}

export function RemeshButton({ isOpen, onClick }: RemeshButtonProps) {
    const [customPolycount, setCustomPolycount] = useState(3000)
    const [selectedPolycount, setSelectedPolycount] = useState("3K")

    return (
        <>
            <RippleButton
                onClick={onClick}
                className="w-full h-16 px-6 group hover:bg-accent rounded-none border-2 border-border"
                rippleColor="rgba(0, 0, 0, 0.1)"
            >
                <div className="flex items-center gap-3">
                    <Wand2 className="h-5 w-5 shrink-0 text-foreground" />
                    <div className="flex flex-col items-start">
                        <span className="font-medium">Remesh</span>
                        <span className="text-xs text-muted-foreground">
                            Optimize and improve your model
                        </span>
                    </div>
                </div>
            </RippleButton>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-background/50 border-x-2 border-b-2 border-border"
                    >
                        <div className="p-2 mx-4 space-y-4">
                            <div>
                                <h3 className="text-sm font-medium mb-2">Target Polycount</h3>
                                <div className="grid grid-cols-4 gap-2 mb-4">
                                    {["Custom", "3K", "20K", "100K"].map((count) => (
                                        <RippleButton
                                            key={count}
                                            className={cn(
                                                "h-8 rounded-none border border-border transition-colors duration-200",
                                                count === "Custom" && "text-[13px]",
                                                selectedPolycount === count
                                                    ? "bg-zinc-800 text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
                                                    : "bg-background hover:bg-accent"
                                            )}
                                            rippleColor={selectedPolycount === count
                                                ? "rgba(255, 255, 255, 0.2)"
                                                : "rgba(0, 0, 0, 0.1)"
                                            }
                                            onClick={() => setSelectedPolycount(count)}
                                        >
                                            <span className={cn(
                                                "text-xs",
                                                count === "Custom" && "text-[13px]"
                                            )}>{count}</span>
                                        </RippleButton>
                                    ))}
                                </div>
                                {selectedPolycount === "Custom" && (
                                    <div className="space-y-2">
                                        <Slider
                                            value={[customPolycount]}
                                            onValueChange={([value]) => setCustomPolycount(value)}
                                            min={1000}
                                            max={100000}
                                            step={100}
                                            className="w-full"
                                        />
                                        <div className="text-xs text-muted-foreground text-center">
                                            {customPolycount.toLocaleString()} polycounts
                                        </div>
                                    </div>
                                )}
                            </div>
                            <RippleButton
                                className="w-full h-10 rounded-none border-2 border-border hover:bg-accent"
                                rippleColor="rgba(0, 0, 0, 0.1)"
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Check className="h-4 w-4" />
                                    <span>Confirm</span>
                                </div>
                            </RippleButton>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
} 