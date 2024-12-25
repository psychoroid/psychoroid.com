'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Paperclip, ArrowUp, X } from 'lucide-react'
import { cn } from "@/lib/actions/utils"
import { ModelSuggestions } from './ModelSuggestions'
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
    onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void
    isUploading: boolean
    onPromptSubmit?: (prompt: string) => void
    showPreview?: boolean
    user?: any
    setShowAuthModal?: (show: boolean) => void
    value?: string
    onChange?: (value: string) => void
}

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png']
const MAX_FILES = 5
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes

export function ChatInstance({ onFileSelect, isUploading, onPromptSubmit, showPreview = false, user, setShowAuthModal, value, onChange }: ChatInstanceProps) {
    const router = useRouter()
    const [inputValue, setInputValue] = useState(value || '')
    const [mounted, setMounted] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [previewImages, setPreviewImages] = useState<Array<{ file: File, url: string }>>([])
    const [isDesktop, setIsDesktop] = useState(false)
    const [hasNonStarterProducts, setHasNonStarterProducts] = useState(false)
    const dragCounter = useRef(0)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const submitButtonRef = useRef<HTMLButtonElement>(null)
    const { currentLanguage } = useTranslation()
    const { theme } = useTheme()

    // Check if user has non-starter products
    useEffect(() => {
        const checkUserProducts = async () => {
            if (!user?.id) {
                setHasNonStarterProducts(false)
                return
            }

            try {
                const { data, error } = await supabase
                    .rpc('has_non_starter_products', {
                        p_user_id: user.id
                    })

                if (error) throw error
                setHasNonStarterProducts(data)
            } catch (error) {
                console.error('Error checking user products:', error)
                setHasNonStarterProducts(false)
            }
        }

        checkUserProducts()
    }, [user?.id])

    const isValidFileType = useCallback((file: File): boolean => {
        return ALLOWED_FILE_TYPES.includes(file.type)
    }, [])

    const isValidFile = useCallback((file: File): { valid: boolean; error?: string } => {
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            return { valid: false, error: t(currentLanguage, 'ui.upload.invalid_format_msg') }
        }

        if (file.size > MAX_FILE_SIZE) {
            return { valid: false, error: t(currentLanguage, 'ui.upload.file_too_large') }
        }

        return { valid: true }
    }, [currentLanguage])

    // Check if device is desktop on mount
    useEffect(() => {
        const checkIfDesktop = () => {
            setIsDesktop(window.innerWidth >= 768) // 768px is a common breakpoint for tablets/mobile
        }

        checkIfDesktop()
        window.addEventListener('resize', checkIfDesktop)

        return () => window.removeEventListener('resize', checkIfDesktop)
    }, [])

    // Clear input and disable when preview is shown
    useEffect(() => {
        if (showPreview) {
            setInputValue('')
        }
    }, [showPreview])

    useEffect(() => {
        setMounted(true)
    }, [])

    // Separate effect for focusing the textarea (only on desktop)
    useEffect(() => {
        if (textareaRef.current && mounted && isDesktop) {
            textareaRef.current.focus()
            textareaRef.current.setSelectionRange(inputValue.length, inputValue.length)
        }
    }, [mounted, inputValue, isDesktop])

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
                .filter(file => {
                    const validation = isValidFile(file);
                    if (!validation.valid && validation.error) {
                        toast.error(validation.error);
                        return false;
                    }
                    return true;
                })
                .slice(0, MAX_FILES)

            if (imageFiles.length === 0) return

            const newPreviews = imageFiles.map(file => ({
                file,
                url: URL.createObjectURL(file)
            }))

            setPreviewImages(prev => [...prev, ...newPreviews].slice(0, MAX_FILES))
        }
    }

    const handleProcessImages = useCallback(() => {
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
    }, [previewImages, onFileSelect]);

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

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        onChange?.(newValue);

        // Only adjust height on desktop
        if (window.innerWidth >= 640) {
            requestAnimationFrame(() => {
                if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto';
                    const newHeight = Math.min(textareaRef.current.scrollHeight, 60); // 60px max height for desktop
                    textareaRef.current.style.height = `${newHeight}px`;
                }
            });
        }
    };

    const handleSubmit = useCallback(() => {
        // Check if user is authenticated before proceeding
        if (!user && setShowAuthModal) {
            setShowAuthModal(true)
            return
        }

        // If we have images, process them
        if (previewImages.length > 0) {
            handleProcessImages()
            return
        }

        // Otherwise handle text submission
        if (inputValue.trim() && onPromptSubmit && !showPreview) {
            onPromptSubmit(inputValue)
            setInputValue('')
            onChange?.('')
        }
    }, [user, setShowAuthModal, previewImages.length, handleProcessImages, inputValue, onPromptSubmit, showPreview, onChange]);

    // Add key repeat handling
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !showPreview) {
            e.preventDefault();
            handleSubmit();
            return;
        }

        // Enable IME composition for better international text input
        if (e.nativeEvent.isComposing) {
            return;
        }

        // Enable key repeat by not preventing default behavior
        // The browser's native key repeat behavior will work
    }, [showPreview, handleSubmit]);

    // Add composition handling for better IME support
    const handleCompositionStart = () => {
        if (textareaRef.current) {
            textareaRef.current.style.backgroundColor = 'rgba(var(--primary-rgb), 0.05)';
        }
    };

    const handleCompositionEnd = () => {
        if (textareaRef.current) {
            textareaRef.current.style.backgroundColor = 'transparent';
        }
    };

    const handleSuggestionSelect = (suggestion: string) => {
        if (!showPreview) {
            setInputValue(suggestion)
            onChange?.(suggestion)
        }
    }

    const handleBoxClick = (e: React.MouseEvent) => {
        // Don't focus if clicking on interactive elements
        const target = e.target as HTMLElement
        if (
            target.tagName === 'BUTTON' ||
            target.closest('button') ||
            target.closest('.controls-area') ||
            target.closest('.interactive') ||
            target.closest('.preview-images-area') ||
            target.tagName === 'TEXTAREA' // Don't handle click if directly on textarea
        ) {
            return
        }

        // Focus the textarea
        if (textareaRef.current) {
            textareaRef.current.focus()
            // Place cursor at the end of the text
            const length = textareaRef.current.value.length
            textareaRef.current.setSelectionRange(length, length)
        }
    }

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
        if (previewImages.length > 0 && submitButtonRef.current) {
            submitButtonRef.current.focus()
        }
    }, [previewImages.length])

    // Update internal value when external value changes
    useEffect(() => {
        if (value !== undefined) {
            setInputValue(value)
        }
    }, [value])

    return (
        <div
            className="space-y-8 sm:space-y-6 translate-y-8 sm:translate-y-12 w-full"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <motion.div
                onClick={handleBoxClick}
                className={cn(
                    "relative flex flex-col justify-between rounded-none p-3 sm:p-3 pt-3 sm:pt-2 shadow-sm cursor-text w-full",
                    "h-[140px] sm:h-[100px]",
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

                <div className="flex flex-col h-full relative z-10">
                    <div className="h-[100px] sm:h-[60px]">
                        <Textarea
                            ref={textareaRef}
                            value={inputValue}
                            onChange={(e) => {
                                if (!showPreview) {
                                    handleInputChange(e);
                                }
                            }}
                            onFocus={() => !showPreview && setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            onCompositionStart={handleCompositionStart}
                            onCompositionEnd={handleCompositionEnd}
                            onKeyDown={mounted ? handleKeyDown : undefined}
                            disabled={showPreview || previewImages.length > 0}
                            autoFocus={isDesktop}
                            spellCheck="true"
                            autoCapitalize="sentences"
                            autoCorrect="on"
                            className={cn(
                                "w-full border-0 bg-transparent px-0 pl-0 text-sm",
                                "text-muted-foreground placeholder:text-muted-foreground/60 placeholder:text-sm",
                                "focus-visible:ring-0 focus:outline-none shadow-none ring-0 ring-offset-0",
                                "border-none focus:border-none active:border-none",
                                "selection:bg-primary/20 selection:text-muted-foreground",
                                "transition-all duration-200 ease-in-out",
                                "h-full sm:h-auto max-h-[100px] sm:max-h-[60px]",
                                "scrollbar-hide pt-1 pr-[50px]",
                                (showPreview || previewImages.length > 0) && "opacity-50 cursor-not-allowed"
                            )}
                            style={{
                                border: 'none',
                                outline: 'none',
                                boxShadow: 'none',
                                resize: 'none',
                                lineHeight: '1.6',
                                letterSpacing: '0.01em',
                                overflowY: 'auto',
                                caretColor: 'var(--primary)',
                                WebkitFontSmoothing: 'antialiased',
                                MozOsxFontSmoothing: 'grayscale',
                            }}
                            placeholder={previewImages.length > 0
                                ? t(currentLanguage, 'ui.upload.ready')
                                : mounted ? t(currentLanguage, 'ui.asset_description') : ''
                            }
                            rows={1}
                        />
                    </div>

                    <div className="h-[40px] sm:h-[30px] flex items-center justify-between controls-area interactive mb-12">
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
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleRemovePreview(index);
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
                            {hasNonStarterProducts && (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        if (!user && setShowAuthModal) {
                                            setShowAuthModal(true)
                                            return
                                        }
                                        router.push('/studio')
                                    }}
                                    className={cn(
                                        "h-7 sm:h-6 px-3",
                                        "border border-dashed",
                                        "text-xs",
                                        theme === 'dark'
                                            ? "border-blue-400 text-blue-400 hover:text-blue-400/90 hover:border-blue-400/90"
                                            : "border-[#D73D57] text-[#D73D57] hover:text-[#D73D57]/90 hover:border-[#D73D57]/90",
                                        "transition-colors rounded-none"
                                    )}
                                >
                                    Studio
                                </Button>
                            )}

                            <RippleButton
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isUploading && mounted && !showPreview) {
                                        const fileInput = document.getElementById('image-upload');
                                        fileInput?.click();
                                    }
                                }}
                                className={cn(
                                    "h-7 w-7 sm:h-6 sm:w-6 flex items-center justify-center p-0",
                                    "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white",
                                    "transition-colors duration-200 rounded-none border-0",
                                    "bg-zinc-200/80 hover:bg-zinc-300/90 dark:bg-zinc-800/90 dark:hover:bg-zinc-700/90",
                                    (isUploading || !mounted || showPreview) && "opacity-50 cursor-not-allowed"
                                )}
                                rippleColor="rgba(255, 255, 255, 0.2)"
                                disabled={isUploading || !mounted || showPreview}
                            >
                                <Paperclip className="h-4 w-4" />
                            </RippleButton>

                            <RippleButton
                                ref={submitButtonRef}
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    if (!isUploading && mounted && !showPreview) {
                                        handleSubmit()
                                    }
                                }}
                                className={cn(
                                    "flex h-7 w-7 sm:h-6 sm:w-6 items-center justify-center rounded-none transition-all duration-200 p-0 border-0",
                                    ((inputValue.length > 0 && !showPreview && !isUploading) || previewImages.length > 0) && mounted
                                        ? "bg-primary/90 text-primary-foreground hover:bg-primary cursor-pointer"
                                        : "bg-zinc-200/80 hover:bg-zinc-300/90 dark:bg-zinc-800/90 dark:hover:bg-zinc-700/90 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white",
                                    (showPreview || isUploading) && "opacity-50 cursor-not-allowed"
                                )}
                                rippleColor="rgba(255, 255, 255, 0.2)"
                                disabled={showPreview || (!inputValue.length && !previewImages.length) || !mounted || isUploading}
                            >
                                <ArrowUp className="h-4 w-4" />
                            </RippleButton>
                        </div>
                    </div>
                </div>
            </motion.div>

            <input
                id="image-upload"
                type="file"
                className="hidden"
                accept="image/jpeg,image/png"
                multiple
                onClick={e => e.stopPropagation()}
                onChange={e => {
                    e.stopPropagation();
                    if (e.target.files && e.target.files.length > 0) {
                        setInputValue('');

                        const imageFiles = Array.from(e.target.files)
                            .filter(file => {
                                const validation = isValidFile(file);
                                if (!validation.valid && validation.error) {
                                    toast.error(validation.error);
                                    return false;
                                }
                                return true;
                            })
                            .slice(0, MAX_FILES - previewImages.length);

                        if (imageFiles.length === 0) return

                        const newPreviews = imageFiles.map(file => ({
                            file,
                            url: URL.createObjectURL(file)
                        }));

                        setPreviewImages(prev => [...prev, ...newPreviews].slice(0, MAX_FILES));
                    }
                }}
                disabled={isUploading || showPreview}
            />

            <AnimatePresence>
                {!showPreview && !previewImages.length && (
                    <ModelSuggestions onSelect={handleSuggestionSelect} />
                )}
            </AnimatePresence>
        </div>
    )
} 