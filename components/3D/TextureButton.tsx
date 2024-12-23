'use client'

import { Grid } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import RippleButton from "@/components/ui/magic/ripple-button"
import { Textarea } from "@/components/ui/textarea"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/actions/utils"

interface TextureButtonProps {
    isOpen: boolean;
    onClick: () => void;
}

export function TextureButton({ isOpen, onClick }: TextureButtonProps) {
    const [inputValue, setInputValue] = useState('')
    const [isFocused, setIsFocused] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const adjustTextareaHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }

    useEffect(() => {
        adjustTextareaHeight()
    }, [inputValue])

    const handleBoxClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement
        if (target.tagName === 'BUTTON' || target.closest('button')) {
            return
        }
        textareaRef.current?.focus()
    }

    return (
        <div className="relative">
            <RippleButton
                onClick={onClick}
                className="w-full h-16 px-6 group hover:bg-accent rounded-none border-2 border-border"
                rippleColor="rgba(34, 211, 238, 0.2)"
            >
                <div className="flex items-center gap-3">
                    <Grid className="h-5 w-5 shrink-0 text-cyan-500 dark:text-cyan-400" />
                    <div className="flex flex-col items-start">
                        <span className="font-medium">Texture</span>
                        <span className="text-xs text-muted-foreground">
                            Enhance with high-quality textures
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
                        className="absolute w-full z-10 bg-background/50 border-x-2 border-b-2 border-border"
                    >
                        <div className="space-y-1 p-1">
                            <motion.div
                                onClick={handleBoxClick}
                                className={cn(
                                    "relative flex flex-col justify-between rounded-none p-3 sm:p-3 pt-3 sm:pt-2 shadow-sm cursor-text",
                                    "h-[140px] sm:h-[100px]",
                                    "before:absolute before:inset-0 before:border before:border-black/[0.08] dark:before:border-white/[0.08]",
                                    "after:absolute after:inset-[0.25px] after:border after:border-black/[0.08] dark:after:border-white/[0.08]",
                                    "before:rounded-none after:rounded-none",
                                    isFocused && "before:border-black/[0.15] after:border-black/[0.15] dark:before:border-white/[0.15] dark:after:border-white/[0.15]",
                                    "bg-slate-50/60 dark:bg-zinc-900/50",
                                    "after:bg-slate-50/60 dark:after:bg-zinc-900/50",
                                    "before:bg-slate-50/60 dark:before:bg-zinc-900/50"
                                )}
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-muted/20 to-muted/10 rounded-none pointer-events-none" />

                                <div className="flex flex-col justify-between h-full relative z-10">
                                    <div className="h-[140px] sm:h-[100px]">
                                        <Textarea
                                            ref={textareaRef}
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onFocus={() => setIsFocused(true)}
                                            onBlur={() => setIsFocused(false)}
                                            className={cn(
                                                "w-full border-0 bg-transparent px-0 pl-0 text-xs",
                                                "text-muted-foreground placeholder:text-muted-foreground/60 placeholder:text-xs",
                                                "focus-visible:ring-0 focus:outline-none shadow-none ring-0 ring-offset-0",
                                                "border-none focus:border-none active:border-none",
                                                "selection:bg-primary/20 selection:text-muted-foreground",
                                                "transition-all duration-200 ease-in-out",
                                                "h-full sm:h-auto"
                                            )}
                                            style={{
                                                border: 'none',
                                                outline: 'none',
                                                boxShadow: 'none',
                                                resize: 'none',
                                                lineHeight: '1.5',
                                                letterSpacing: '0.01em'
                                            }}
                                            placeholder="Describe your desired style of the object, e.g., ancient style, HDR, highest quality, ultra detailed."
                                            rows={1}
                                        />
                                    </div>
                                </div>
                            </motion.div>

                            <RippleButton
                                className="w-full h-10 bg-cyan-500 text-white rounded-none"
                                rippleColor="rgba(255, 255, 255, 0.2)"
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Grid className="h-4 w-4" />
                                    <span>Texture</span>
                                </div>
                            </RippleButton>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
} 