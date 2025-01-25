'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Paperclip, ArrowUp, X, Loader2 } from 'lucide-react'
import { cn } from "@/lib/actions/utils"
import { motion } from 'framer-motion'
import RippleButton from "@/components/ui/magic/ripple-button"
import { Textarea } from "@/components/ui/textarea"
import { useTheme } from 'next-themes'
import { toast } from 'react-hot-toast'

interface CADResponse {
    step?: string;
    gltf?: string;
    obj?: string;
    message: string;
    modelId: string;
    error?: string;
    details?: string;
    modelUrl?: string;
    format?: string;
}

interface ChatInstanceProps {
    isUploading: boolean
    onPromptSubmit?: (prompt: string) => Promise<CADResponse>
    showPreview?: boolean
    user?: any
    setShowAuthModal?: (show: boolean) => void
    value?: string
    onChange?: (value: string) => void
    onSuccess?: (response: CADResponse) => void
}

export function ChatInstance({
    isUploading,
    onPromptSubmit,
    showPreview = false,
    user,
    setShowAuthModal,
    value,
    onChange,
    onSuccess
}: ChatInstanceProps) {
    const [inputValue, setInputValue] = useState(value || '')
    const [mounted, setMounted] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [progress, setProgress] = useState(0)
    const progressInterval = useRef<NodeJS.Timeout>()
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const { theme } = useTheme()

    useEffect(() => {
        setMounted(true)
    }, [])

    // Cleanup progress interval
    useEffect(() => {
        return () => {
            if (progressInterval.current) {
                clearInterval(progressInterval.current)
            }
        }
    }, [])

    const startProgressSimulation = () => {
        setProgress(0)
        if (progressInterval.current) {
            clearInterval(progressInterval.current)
        }
        progressInterval.current = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) {
                    return prev
                }
                return prev + Math.random() * 10
            })
        }, 1000)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        onChange?.(newValue);

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const newHeight = Math.min(textareaRef.current.scrollHeight, 100);
            textareaRef.current.style.height = `${newHeight}px`;
        }
    };

    const handleSubmit = useCallback(async () => {
        if (!user && setShowAuthModal) {
            setShowAuthModal(true)
            return
        }

        if (inputValue.trim() && onPromptSubmit && !showPreview && !isGenerating) {
            try {
                setIsGenerating(true)
                startProgressSimulation()
                const result = await onPromptSubmit(inputValue)

                // Handle API errors
                if (result?.error) {
                    console.error('API Error:', result.error, result.details)
                    toast.error(result.error)
                    return
                }

                // Validate model data
                if (result?.modelUrl) {
                    console.log('CADChat: Received model data', {
                        hasModelUrl: !!result.modelUrl,
                        modelUrl: result.modelUrl,
                        format: result.format,
                        modelId: result.modelId
                    })

                    toast.success(result.message || 'CAD model generated successfully')
                    onSuccess?.(result)

                    setInputValue('')
                    onChange?.('')
                    if (textareaRef.current) {
                        textareaRef.current.style.height = 'auto'
                    }
                } else {
                    const errorMsg = 'No model data received'
                    console.error(errorMsg)
                    toast.error(errorMsg)
                }
            } catch (error: any) {
                console.error('Failed to generate CAD:', error)
                const errorMessage = error?.message || error?.toString() || 'Failed to generate CAD model. Please try again.'
                toast.error(errorMessage)
            } finally {
                setIsGenerating(false)
                setProgress(100)
                if (progressInterval.current) {
                    clearInterval(progressInterval.current)
                }
                setTimeout(() => setProgress(0), 1000)
            }
        }
    }, [user, setShowAuthModal, inputValue, onPromptSubmit, showPreview, isGenerating, onChange, onSuccess])

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !showPreview) {
            e.preventDefault();
            handleSubmit();
            return;
        }
    }, [showPreview, handleSubmit]);

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

                {isGenerating && progress > 0 && (
                    <div className="absolute top-0 left-0 h-0.5 bg-primary/50 transition-all duration-300" style={{ width: `${progress}%` }} />
                )}

                <div className="flex flex-col relative z-10">
                    <Textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={handleInputChange}
                        onFocus={() => !showPreview && setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        onKeyDown={mounted ? handleKeyDown : undefined}
                        disabled={showPreview || isGenerating}
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
                        placeholder={
                            isGenerating
                                ? `Generating CAD model... ${Math.round(progress)}%`
                                : "Describe what you want to create (e.g., 'A flower with 5 petals' or 'A gear with 40 teeth')..."
                        }
                        rows={1}
                    />

                    <div className="flex justify-end mt-1">
                        <RippleButton
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                if (!isUploading && mounted && !showPreview && !isGenerating) {
                                    handleSubmit()
                                }
                            }}
                            className={cn(
                                "flex h-7 w-7 items-center justify-center rounded-none transition-all duration-200 p-0 border-0",
                                (inputValue.length > 0 && !showPreview && !isUploading && !isGenerating) && mounted
                                    ? "bg-primary/90 text-primary-foreground hover:bg-primary cursor-pointer"
                                    : "bg-zinc-200/80 hover:bg-zinc-300/90 dark:bg-zinc-800/90 dark:hover:bg-zinc-700/90 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white",
                                (showPreview || isUploading || isGenerating) && "opacity-50 cursor-not-allowed"
                            )}
                            rippleColor="rgba(255, 255, 255, 0.2)"
                            disabled={showPreview || !inputValue.length || !mounted || isUploading || isGenerating}
                        >
                            {isGenerating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <ArrowUp className="h-4 w-4" />
                            )}
                        </RippleButton>
                    </div>
                </div>
            </motion.div>
        </div>
    )
} 