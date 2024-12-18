'use client'

import React, { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Paperclip, ArrowUp, Wand2 } from 'lucide-react'
import { cn } from "@/lib/actions/utils"
import { motion } from 'framer-motion'
import Image from 'next/image'
import RippleButton from "@/components/ui/magic/ripple-button"

interface WorkspaceChatProps {
    onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void
    isUploading: boolean
    onPromptSubmit?: (prompt: string) => void
    user?: any
    setShowAuthModal?: (show: boolean) => void
    onGenerateVariation?: () => void
}

export function WorkspaceChat({
    onFileSelect,
    isUploading,
    onPromptSubmit,
    user,
    setShowAuthModal,
    onGenerateVariation
}: WorkspaceChatProps) {
    const [inputValue, setInputValue] = useState('')
    const [isFocused, setIsFocused] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const dragCounter = React.useRef(0)
    const [inputRef, setInputRef] = useState<HTMLInputElement | null>(null)

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        dragCounter.current += 1
        if (e.dataTransfer.types.includes('Files')) {
            setIsDragging(true)
        }
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        dragCounter.current -= 1
        if (dragCounter.current === 0) {
            setIsDragging(false)
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.dataTransfer.types.includes('Files')) {
            e.dataTransfer.dropEffect = 'copy'
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        dragCounter.current = 0

        const files = e.dataTransfer.files
        if (files && files.length > 0) {
            const event = {
                target: {
                    files
                }
            } as unknown as React.ChangeEvent<HTMLInputElement>
            onFileSelect(event)
        }
    }

    const handleSubmit = () => {
        if (!user && setShowAuthModal) {
            setShowAuthModal(true)
            return
        }

        if (inputValue.trim() && onPromptSubmit) {
            onPromptSubmit(inputValue)
            setInputValue('')
        }
    }

    const handleBoxClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement
        if (
            target.tagName === 'BUTTON' ||
            target.closest('button') ||
            target.closest('.controls-area') ||
            target.closest('.interactive')
        ) {
            return
        }
        inputRef?.focus()
    }

    return (
        <motion.div
            className="space-y-4"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <motion.div
                onClick={handleBoxClick}
                className={cn(
                    "relative flex flex-col justify-between rounded-none p-6 sm:p-4 pt-4 sm:pt-2 min-h-[140px] sm:min-h-[100px] shadow-sm cursor-text",
                    "before:absolute before:inset-0 before:border before:border-border/20",
                    "after:absolute after:inset-[0.25px] after:border after:border-border/20",
                    "before:rounded-none after:rounded-none",
                    isFocused && "before:border-border/40 after:border-border/40",
                    isDragging && "before:border-primary/40 after:border-primary/40",
                    "bg-background dark:bg-background",
                    "after:bg-background dark:after:bg-background",
                    "before:bg-background dark:before:bg-background"
                )}
                animate={{
                    scale: isDragging ? 1.02 : 1,
                    borderColor: isDragging ? "rgba(215, 61, 87, 0.4)" : "rgba(63, 63, 70, 0.2)"
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-muted/20 to-muted/10 rounded-none pointer-events-none" />

                <div className="flex flex-col justify-between h-full relative z-10">
                    <Input
                        ref={(el) => setInputRef(el)}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        className={cn(
                            "w-full border-0 bg-transparent px-0 pl-0 text-base sm:text-sm",
                            "text-muted-foreground dark:text-muted-foreground placeholder:text-muted-foreground placeholder:text-base sm:placeholder:text-sm",
                            "focus-visible:ring-0 focus:outline-none shadow-none ring-0 ring-offset-0",
                            "relative z-10"
                        )}
                        placeholder="Modify your model or generate variations..."
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSubmit()
                            }
                        }}
                    />

                    <div className="flex items-center justify-between mt-4 sm:mt-2 controls-area interactive">
                        <div className="flex gap-2 z-50">
                            <RippleButton
                                onClick={onGenerateVariation}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 text-xs font-medium",
                                    "text-muted-foreground hover:text-foreground",
                                    "transition-colors duration-200 rounded-none border border-border/20",
                                    "hover:bg-background/80",
                                    "disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                                disabled={isUploading}
                            >
                                <Wand2 className="h-3 w-3" />
                                <span>Generate Variation</span>
                            </RippleButton>
                        </div>

                        <div className="flex gap-2 z-50">
                            <RippleButton
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    if (!isUploading) {
                                        const fileInput = document.getElementById('workspace-image-upload')
                                        fileInput?.click()
                                    }
                                }}
                                className={cn(
                                    "h-8 w-8 sm:h-6 sm:w-6 flex items-center justify-center p-0",
                                    "text-muted-foreground hover:text-foreground",
                                    "transition-colors duration-200 rounded-none border-0",
                                    "hover:bg-background/80",
                                    isUploading && "opacity-50 cursor-not-allowed"
                                )}
                                rippleColor="rgba(255, 255, 255, 0.2)"
                                disabled={isUploading}
                            >
                                <Paperclip className="h-5 w-5 sm:h-4 sm:w-4" />
                            </RippleButton>

                            <RippleButton
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    if (!isUploading) {
                                        handleSubmit()
                                    }
                                }}
                                className={cn(
                                    "flex h-8 w-8 sm:h-6 sm:w-6 items-center justify-center rounded-none transition-all duration-200 p-0 border-0",
                                    inputValue.length > 0
                                        ? "bg-primary/80 text-primary-foreground hover:bg-primary cursor-pointer"
                                        : "bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground",
                                )}
                                rippleColor="rgba(255, 255, 255, 0.2)"
                                disabled={!inputValue.length || isUploading}
                            >
                                <ArrowUp className="h-5 w-5 sm:h-4 sm:w-4" />
                            </RippleButton>
                        </div>
                    </div>
                </div>
            </motion.div>

            <input
                id="workspace-image-upload"
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onClick={e => e.stopPropagation()}
                onChange={e => {
                    e.stopPropagation()
                    if (e.target.files && e.target.files.length > 0) {
                        onFileSelect(e)
                    }
                }}
                disabled={isUploading}
            />
        </motion.div>
    )
} 