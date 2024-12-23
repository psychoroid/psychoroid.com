'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Paperclip, X, Sparkles } from 'lucide-react'
import { cn } from "@/lib/actions/utils"
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import RippleButton from "@/components/ui/magic/ripple-button"
import { Textarea } from "@/components/ui/textarea"

interface WorkspaceChatProps {
    onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void
    isUploading: boolean
    onPromptSubmit?: (prompt: string) => void
    user?: any
    onGenerateVariation?: () => void
    onInputChange?: (value: string) => void
}

export function WorkspaceChat({
    onFileSelect,
    isUploading,
    onPromptSubmit,
    user,
    onGenerateVariation,
    onInputChange
}: WorkspaceChatProps) {
    const [inputValue, setInputValue] = useState('')
    const [isFocused, setIsFocused] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [previewImages, setPreviewImages] = useState<Array<{ file: File, url: string }>>([])
    const dragCounter = useRef(0)
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

    useEffect(() => {
        return () => {
            // Cleanup preview URLs when component unmounts
            previewImages.forEach(img => {
                URL.revokeObjectURL(img.url)
            })
        }
    }, [previewImages])

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
            const imageFiles = Array.from(files)
                .filter(file => file.type.startsWith('image/'))
                .slice(0, 5) // Limit to 5 files

            const newPreviews = imageFiles.map(file => ({
                file,
                url: URL.createObjectURL(file)
            }))

            setPreviewImages(prev => [...prev, ...newPreviews].slice(0, 5))
        }
    }

    const handleProcessImages = () => {
        if (previewImages.length > 0) {
            const event = {
                target: {
                    files: previewImages.map(p => p.file)
                }
            } as unknown as React.ChangeEvent<HTMLInputElement>
            onFileSelect(event)
            // Clear previews after processing
            previewImages.forEach(img => URL.revokeObjectURL(img.url))
            setPreviewImages([])
        }
    }

    const handleRemovePreview = (index: number) => {
        setPreviewImages(prev => {
            const newPreviews = [...prev]
            URL.revokeObjectURL(newPreviews[index].url)
            newPreviews.splice(index, 1)
            return newPreviews
        })
    }

    const handleBoxClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement
        if (
            target.tagName === 'BUTTON' ||
            target.closest('button') ||
            target.closest('.controls-area') ||
            target.closest('.interactive') ||
            target.closest('.preview-images-area') ||
            target.tagName === 'TEXTAREA'
        ) {
            return
        }
        textareaRef.current?.focus()
    }

    const handleGenerate = () => {
        if (inputValue.trim() && onPromptSubmit) {
            onPromptSubmit(inputValue)
            setInputValue('')
        }
    }

    return (
        <div className="space-y-1">
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
                        "relative flex flex-col justify-between rounded-none p-3 sm:p-3 pt-3 sm:pt-2 shadow-sm cursor-text",
                        "h-[180px] sm:h-[140px]",
                        "before:absolute before:inset-0 before:border before:border-black/[0.08] dark:before:border-white/[0.08]",
                        "after:absolute after:inset-[0.25px] after:border after:border-black/[0.08] dark:after:border-white/[0.08]",
                        "before:rounded-none after:rounded-none",
                        isFocused && "before:border-black/[0.15] after:border-black/[0.15] dark:before:border-white/[0.15] dark:after:border-white/[0.15]",
                        isDragging && "before:border-primary/20 after:border-primary/20",
                        "bg-slate-50/60 dark:bg-zinc-900/50",
                        "after:bg-slate-50/60 dark:after:bg-zinc-900/50",
                        "before:bg-slate-50/60 dark:before:bg-zinc-900/50"
                    )}
                >
                    <AnimatePresence>
                        {isDragging && previewImages.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-primary/5 backdrop-blur-[2px] flex items-center justify-center z-50"
                            >
                                <motion.div
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -10, opacity: 0 }}
                                    className="flex flex-col items-center gap-2"
                                >
                                    <motion.p className="text-primary/80 font-medium">
                                        Let&apos;s do this!
                                    </motion.p>
                                    <motion.p className="text-xs text-muted-foreground/60">
                                        Supported formats: JPG, PNG, WebP (max 5 files)
                                    </motion.p>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="absolute inset-0 bg-gradient-to-b from-muted/20 to-muted/10 rounded-none pointer-events-none" />

                    <div className="flex flex-col justify-between h-full relative z-10">
                        <div className="h-[140px] sm:h-[100px]">
                            <Textarea
                                ref={textareaRef}
                                value={inputValue}
                                onChange={(e) => {
                                    setInputValue(e.target.value)
                                    onInputChange?.(e.target.value)
                                }}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                disabled={previewImages.length > 0}
                                className={cn(
                                    "w-full border-0 bg-transparent px-0 pl-0 text-xs",
                                    "text-muted-foreground placeholder:text-muted-foreground/60 placeholder:text-xs",
                                    "focus-visible:ring-0 focus:outline-none shadow-none ring-0 ring-offset-0",
                                    "border-none focus:border-none active:border-none",
                                    "selection:bg-primary/20 selection:text-muted-foreground",
                                    "transition-all duration-200 ease-in-out",
                                    "h-full sm:h-auto",
                                    previewImages.length > 0 && "opacity-50 cursor-not-allowed"
                                )}
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    boxShadow: 'none',
                                    resize: 'none',
                                    lineHeight: '1.5',
                                    letterSpacing: '0.01em'
                                }}
                                placeholder={previewImages.length > 0 ? "Ready to process..." : "Modify your model or generate variations..."}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        handleGenerate()
                                    }
                                }}
                                rows={1}
                            />
                        </div>

                        <div className="flex items-center justify-between mt-4 sm:mt-2 controls-area interactive">
                            <div className="flex flex-wrap gap-1 z-50 preview-images-area">
                                <AnimatePresence mode="popLayout">
                                    {previewImages.map((img, index) => (
                                        <motion.div
                                            key={img.url}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            layout
                                            className="relative w-10 h-10 mb-6 flex-shrink-0 group"
                                        >
                                            <Image
                                                src={img.url}
                                                alt={`Preview ${index + 1}`}
                                                fill
                                                className="object-cover rounded-sm"
                                                sizes="40px"
                                                priority
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    handleRemovePreview(index)
                                                }}
                                                className={cn(
                                                    "absolute -top-1.5 -right-1.5 w-5 h-5 z-50",
                                                    "flex items-center justify-center",
                                                    "bg-background/80 backdrop-blur-sm rounded-full",
                                                    "hover:bg-background cursor-pointer",
                                                    "group-hover:opacity-100",
                                                    "transition-all duration-200",
                                                    "border border-border/50"
                                                )}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            <div className="flex gap-2 z-50 ml-auto">
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
                                        "h-7 w-7 sm:h-6 sm:w-6 flex items-center justify-center p-0",
                                        "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white",
                                        "transition-colors duration-200 rounded-none border-0",
                                        "bg-zinc-200/80 hover:bg-zinc-300/90 dark:bg-zinc-800/90 dark:hover:bg-zinc-700/90",
                                        isUploading && "opacity-50 cursor-not-allowed"
                                    )}
                                    rippleColor="rgba(255, 255, 255, 0.2)"
                                    disabled={isUploading}
                                >
                                    <Paperclip className="h-4 w-4" />
                                </RippleButton>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            <div className="p-0 border border-border bg-background/50">
                <RippleButton
                    onClick={handleGenerate}
                    className="w-full h-10 bg-gradient-to-r from-[#D73D57] via-purple-500 to-cyan-500 text-white rounded-none"
                    rippleColor="rgba(255, 255, 255, 0.3)"
                    disabled={isUploading || !inputValue.trim()}
                >
                    <div className="flex items-center justify-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        <span>Generate</span>
                    </div>
                </RippleButton>
            </div>

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
                        setInputValue('')

                        const imageFiles = Array.from(e.target.files)
                            .slice(0, 5 - previewImages.length)

                        const newPreviews = imageFiles.map(file => ({
                            file,
                            url: URL.createObjectURL(file)
                        }))

                        setPreviewImages(prev => [...prev, ...newPreviews].slice(0, 5))
                    }
                }}
                disabled={isUploading}
            />
        </div>
    )
} 