'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Paperclip, ArrowUp, X } from 'lucide-react'
import { cn } from "@/lib/actions/utils"
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import RippleButton from "@/components/ui/magic/ripple-button"
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from '@/lib/contexts/TranslationContext'
import { t } from '@/lib/i18n/translations'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { useTheme } from 'next-themes'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase/supabase'

interface ChatInstanceProps {
    isUploading: boolean
    onPromptSubmit?: (prompt: string) => void
    showPreview?: boolean
    user?: any
    setShowAuthModal?: (show: boolean) => void
    value?: string
    onChange?: (value: string) => void
}

export function ChatInstance({
    isUploading,
    onPromptSubmit,
    showPreview = false,
    user,
    setShowAuthModal,
    value,
    onChange
}: ChatInstanceProps) {
    const [inputValue, setInputValue] = useState(value || '')
    const [mounted, setMounted] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const { theme } = useTheme()

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        onChange?.(newValue);

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const newHeight = Math.min(textareaRef.current.scrollHeight, 100); // Allow more height for content
            textareaRef.current.style.height = `${newHeight}px`;
        }
    };

    const handleSubmit = useCallback(() => {
        if (!user && setShowAuthModal) {
            setShowAuthModal(true)
            return
        }

        if (inputValue.trim() && onPromptSubmit && !showPreview) {
            onPromptSubmit(inputValue)
            setInputValue('')
            onChange?.('')
            // Reset height after submission
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    }, [user, setShowAuthModal, inputValue, onPromptSubmit, showPreview, onChange]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !showPreview) {
            e.preventDefault();
            handleSubmit();
            return;
        }
    }, [showPreview, handleSubmit]);

    // Update internal value when external value changes
    useEffect(() => {
        if (value !== undefined) {
            setInputValue(value)
        }
    }, [value])

    return (
        <div className="w-full">
            <motion.div
                className={cn(
                    "relative flex flex-col justify-between rounded-none p-2 shadow-sm cursor-text w-full",
                    "min-h-[50px] transition-all duration-200",
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

                <div className="flex flex-col relative z-10">
                    <Textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={handleInputChange}
                        onFocus={() => !showPreview && setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        onKeyDown={mounted ? handleKeyDown : undefined}
                        disabled={showPreview}
                        spellCheck="true"
                        autoCapitalize="sentences"
                        autoCorrect="on"
                        className={cn(
                            "w-full min-h-[36px] resize-none",
                            "text-sm bg-transparent px-2",
                            "border-0 focus-visible:ring-0 focus:outline-none shadow-none",
                            "text-muted-foreground placeholder:text-muted-foreground/60",
                            "selection:bg-primary/20 selection:text-muted-foreground",
                            showPreview && "opacity-50 cursor-not-allowed"
                        )}
                        style={{
                            border: 'none',
                            outline: 'none',
                            boxShadow: 'none',
                            lineHeight: '1.6',
                            caretColor: 'var(--primary)'
                        }}
                        placeholder="Describe your CAD model requirements (e.g., 'Create a cylindrical container with a threaded lid...')"
                        rows={1}
                    />

                    <div className="flex justify-end mt-1">
                        <RippleButton
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                if (!isUploading && mounted && !showPreview) {
                                    handleSubmit()
                                }
                            }}
                            className={cn(
                                "flex h-7 w-7 items-center justify-center rounded-none transition-all duration-200 p-0 border-0",
                                (inputValue.length > 0 && !showPreview && !isUploading) && mounted
                                    ? "bg-primary/90 text-primary-foreground hover:bg-primary cursor-pointer"
                                    : "bg-zinc-200/80 hover:bg-zinc-300/90 dark:bg-zinc-800/90 dark:hover:bg-zinc-700/90 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white",
                                (showPreview || isUploading) && "opacity-50 cursor-not-allowed"
                            )}
                            rippleColor="rgba(255, 255, 255, 0.2)"
                            disabled={showPreview || !inputValue.length || !mounted || isUploading}
                        >
                            <ArrowUp className="h-4 w-4" />
                        </RippleButton>
                    </div>
                </div>
            </motion.div>
        </div>
    )
} 