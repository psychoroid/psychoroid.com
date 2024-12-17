'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Paperclip, ArrowUp, X } from 'lucide-react'
import { cn } from "@/lib/actions/utils"
import { ModelSuggestions } from './ModelSuggestions'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

interface ChatInstanceProps {
    onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void
    isUploading: boolean
    onPromptSubmit?: (prompt: string) => void
}

export function ChatInstance({ onFileSelect, isUploading, onPromptSubmit }: ChatInstanceProps) {
    const [inputValue, setInputValue] = useState('')
    const [mounted, setMounted] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [previewImages, setPreviewImages] = useState<Array<{ file: File, url: string }>>([])
    const dragCounter = React.useRef(0)

    useEffect(() => {
        setMounted(true)
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

        // Only set dragging if we have files
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

        // Show drop effect only for files
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
                .slice(0, 10) // Limit to 10 files

            const newPreviews = imageFiles.map(file => ({
                file,
                url: URL.createObjectURL(file)
            }))

            setPreviewImages(prev => [...prev, ...newPreviews].slice(0, 10))
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

    const handleCancelAllPreviews = () => {
        previewImages.forEach(img => URL.revokeObjectURL(img.url))
        setPreviewImages([])
    }

    const handleSubmit = () => {
        if (inputValue.trim() && onPromptSubmit) {
            onPromptSubmit(inputValue)
            setInputValue('')
        }
    }

    const handleSuggestionSelect = (suggestion: string) => {
        setInputValue(suggestion)
        if (onPromptSubmit) {
            onPromptSubmit(suggestion)
        }
    }

    return (
        <div
            className="space-y-6"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <motion.div
                className={cn(
                    "relative flex flex-col justify-between rounded-none p-4 pt-2 min-h-[100px] shadow-sm",
                    "before:absolute before:inset-0 before:border before:border-border/40",
                    "after:absolute after:inset-[0.25px] after:border after:border-border/40",
                    "before:rounded-none after:rounded-none",
                    isFocused && "before:border-border/60 after:border-border/60",
                    isDragging && "before:border-primary/60 after:border-primary/60",
                    "bg-card/30 backdrop-blur-sm"
                )}
                animate={{
                    scale: isDragging ? 1.02 : 1,
                    borderColor: isDragging ? "rgba(var(--primary), 0.6)" : "rgba(var(--border), 0.4)"
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
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
                                    Supported formats: JPG, PNG, WebP (max 10 files)
                                </motion.p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="absolute inset-0 bg-gradient-to-b from-muted/20 to-muted/10 rounded-none pointer-events-none" />

                <div className="flex flex-col justify-between h-full relative z-10">
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        className={cn(
                            "w-full border-0 bg-transparent px-0 pl-0 text-xs",
                            "text-foreground placeholder:text-muted-foreground/60 placeholder:text-xs",
                            "focus-visible:ring-0 focus:outline-none shadow-none ring-0 ring-offset-0",
                            "relative z-10"
                        )}
                        placeholder={previewImages.length > 0 ? "Images uploaded for processing" : "Describe your dream model or just drop an image..."}
                        onKeyDown={mounted ? (e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSubmit()
                            }
                        } : undefined}
                    />

                    <div className="flex items-center justify-between mt-2">
                        <div className="flex gap-1">
                            <AnimatePresence mode="popLayout">
                                {previewImages.map((img, index) => (
                                    <motion.div
                                        key={img.url}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        layout
                                        className="relative w-8 h-8 flex-shrink-0"
                                    >
                                        <Image
                                            src={img.url}
                                            alt={`Preview ${index + 1}`}
                                            fill
                                            className="object-cover rounded-sm"
                                            sizes="32px"
                                            priority
                                        />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleRemovePreview(index)
                                            }}
                                            className="absolute -top-1 -right-1 bg-background/80 backdrop-blur-sm rounded-full p-0.5 hover:bg-background"
                                        >
                                            <X className="h-2 w-2" />
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-6 w-6",
                                    "text-muted-foreground hover:text-foreground",
                                    "transition-colors duration-200"
                                )}
                                disabled={isUploading || !mounted}
                                onClick={mounted ? () => {
                                    document.getElementById('image-upload')?.click()
                                } : undefined}
                            >
                                <Paperclip className="h-4 w-4" />
                            </Button>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={mounted ? handleSubmit : undefined}
                                disabled={!mounted || inputValue.length === 0}
                                type="button"
                                className={cn(
                                    "flex h-6 w-6 items-center justify-center rounded-none transition-all duration-200",
                                    inputValue.length > 0 && mounted
                                        ? "bg-primary/80 text-primary-foreground hover:bg-primary"
                                        : "bg-muted text-muted-foreground"
                                )}
                            >
                                <ArrowUp className="h-4 w-4" />
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.div>

            <input
                id="image-upload"
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        const imageFiles = Array.from(e.target.files)
                            .slice(0, 10 - previewImages.length)

                        const newPreviews = imageFiles.map(file => ({
                            file,
                            url: URL.createObjectURL(file)
                        }))

                        setPreviewImages(prev => [...prev, ...newPreviews].slice(0, 10))
                    }
                }}
                disabled={isUploading}
            />

            <ModelSuggestions onSelect={handleSuggestionSelect} />
        </div>
    )
} 