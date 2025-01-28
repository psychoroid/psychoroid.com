'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowUp, Loader2 } from 'lucide-react'
import { cn } from "@/lib/actions/utils"
import { motion, AnimatePresence } from 'framer-motion'
import RippleButton from "@/components/ui/magic/ripple-button"
import { Textarea } from "@/components/ui/textarea"
import { useTheme } from 'next-themes'
import { toast } from 'react-hot-toast'
import { useCADChat } from '@/lib/hooks/use-cad-chat'
import { supabase } from '@/lib/supabase'

interface CADResponse {
    id?: string;
    status: 'pending' | 'completed' | 'error' | 'in_progress';
    message: string;
    modelUrl?: string;
    error?: string;
    format?: string;
    details?: {
        format: string;
        size: number;
        timestamp: string;
    };
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
    sessionId?: string
}

export function ChatInstance({
    isUploading,
    showPreview = false,
    user,
    setShowAuthModal,
    value,
    onChange,
    onSuccess,
    sessionId
}: ChatInstanceProps) {
    const [inputValue, setInputValue] = useState(value || '')
    const [progress, setProgress] = useState(0)
    const [isGenerating, setIsGenerating] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const { theme } = useTheme()
    const {
        messages,
        currentChat,
        createChat,
        loadChatData,
        setMessages
    } = useCADChat(sessionId)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Add scroll to bottom effect
    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'end',
                inline: 'nearest'
            });
            // Force another scroll after a small delay to ensure we reach the bottom
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({
                    behavior: 'auto',
                    block: 'end',
                    inline: 'nearest'
                });
            }, 150);
        }
    }, []);

    useEffect(() => {
        // Initial scroll with a delay to ensure content is rendered
        setTimeout(scrollToBottom, 100);
    }, [messages, scrollToBottom]);

    // Load chat messages when sessionId changes
    useEffect(() => {
        if (sessionId) {
            console.log('Loading chat messages for session:', sessionId);
            // Don't clear messages immediately to avoid flash
            loadChatData(sessionId).then(() => {
                // Focus the input after loading chat
                if (textareaRef.current) {
                    textareaRef.current.focus();
                }
            });
        }
    }, [sessionId, loadChatData]);

    // Auto-focus input after message sent
    useEffect(() => {
        if (!isGenerating && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isGenerating]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messages.length > 0) {
            console.log('Messages updated, scrolling to bottom:', messages.length);
            setTimeout(scrollToBottom, 100);
        }
    }, [messages, scrollToBottom]);

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

        if (inputValue.trim()) {
            try {
                setIsGenerating(true)

                // Get the current chat ID - either from URL or current chat state
                const chatId = sessionId || currentChat?.id
                console.log('Current chat state:', { currentChat, sessionId, chatId })

                // If we don't have a chat ID, create a new chat
                let activeId: string | undefined = chatId
                if (!activeId) {
                    console.log('Creating new chat...')
                    const chat = await createChat('New Chat')
                    if (!chat) {
                        throw new Error('Failed to create chat')
                    }
                    activeId = chat.id
                }

                if (!activeId) {
                    throw new Error('Failed to get or create chat')
                }

                // Save user message first
                console.log('Saving user message...', {
                    activeId,
                    content: inputValue.trim(),
                    role: 'user'
                })

                // Use the RPC function to save message
                const { data: userMessage, error: userMessageError } = await supabase
                    .rpc('save_cad_message', {
                        p_chat_id: activeId,
                        p_role: 'user',
                        p_content: inputValue.trim(),
                        p_parameters: {}
                    })

                if (userMessageError) {
                    console.error('Error saving user message:', userMessageError)
                    throw new Error('Failed to save user message')
                }

                // Update messages state with user message
                const newUserMessage = {
                    id: userMessage,
                    role: 'user' as const,
                    content: inputValue.trim(),
                    parameters: {},
                    created_at: new Date().toISOString()
                }

                // Submit prompt to CAD generation API
                console.log('Submitting prompt to CAD API...')
                const submitResponse = await fetch('/api/cad/submit-prompt', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: inputValue.trim() })
                })

                if (!submitResponse.ok) {
                    throw new Error('Failed to submit CAD generation request')
                }

                const submitResult: CADResponse = await submitResponse.json()
                console.log('CAD generation submitted:', submitResult)

                if (submitResult.status === 'error' || !submitResult.id) {
                    throw new Error(submitResult.error || 'Failed to start CAD generation')
                }

                // Start polling for results
                const pollInterval = setInterval(async () => {
                    try {
                        console.log('Polling generation status for ID:', submitResult.id)
                        const pollResponse = await fetch(`/api/cad/get-generation?id=${submitResult.id}`)

                        if (!pollResponse.ok) {
                            throw new Error('Failed to check generation status')
                        }

                        const pollResult: CADResponse = await pollResponse.json()
                        console.log('Poll result:', pollResult)

                        if (pollResult.status === 'error') {
                            clearInterval(pollInterval)
                            throw new Error(pollResult.error || 'CAD generation failed')
                        }

                        if (pollResult.status === 'completed' && pollResult.modelUrl) {
                            clearInterval(pollInterval)
                            console.log('Generation completed with model URL:', pollResult.modelUrl.substring(0, 50) + '...')

                            // Create a more informative message
                            const modelInfo = pollResult.details
                                ? `\n\nModel Details:\n• Format: ${pollResult.details.format}\n• Size: ${(pollResult.details.size / 1024).toFixed(2)}KB\n• Generated: ${new Date(pollResult.details.timestamp).toLocaleString()}`
                                : '';

                            // Save assistant response with the model URL
                            const { data: assistantMessage, error: assistantMessageError } = await supabase
                                .rpc('save_cad_message', {
                                    p_chat_id: activeId,
                                    p_role: 'assistant',
                                    p_content: `Here's your generated 3D model!${modelInfo}`,
                                    p_parameters: {
                                        modelUrl: pollResult.modelUrl,
                                        format: pollResult.format || 'glb',
                                        status: 'completed',
                                        details: pollResult.details
                                    }
                                })

                            if (assistantMessageError) {
                                console.error('Error saving assistant message:', assistantMessageError)
                                throw new Error('Failed to save assistant message')
                            }

                            // Update messages state with both messages
                            const newAssistantMessage = {
                                id: assistantMessage,
                                role: 'assistant' as const,
                                content: `Here's your generated 3D model!${modelInfo}`,
                                parameters: {
                                    modelUrl: pollResult.modelUrl,
                                    format: pollResult.format || 'glb',
                                    status: 'completed',
                                    details: pollResult.details
                                },
                                created_at: new Date().toISOString()
                            }

                            setMessages([...messages, newUserMessage, newAssistantMessage])
                            setProgress(100)

                            // Notify parent component if callback exists
                            if (onSuccess) {
                                onSuccess(pollResult)
                            }
                        } else if (pollResult.status === 'in_progress') {
                            // Update progress for pending state
                            setProgress((prev) => Math.min(90, prev + 5))
                        }
                    } catch (error) {
                        clearInterval(pollInterval)
                        console.error('Polling error:', error)
                        toast.error('Failed to check CAD generation status')
                        setProgress(0)
                    }
                }, 2000) // Poll every 2 seconds

                // Generate and update title for the first message
                if (messages.length === 0) {
                    console.log('Generating AI title...')
                    const titleResponse = await fetch('/api/chat/title', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prompt: inputValue.trim() })
                    })

                    if (!titleResponse.ok) {
                        throw new Error('Failed to generate title')
                    }

                    const { title } = await titleResponse.json()
                    console.log('Generated AI title:', title)

                    // Update chat title using RPC
                    const { error: titleError } = await supabase
                        .rpc('rename_cad_chat', {
                            p_chat_id: activeId,
                            p_title: title
                        })

                    if (titleError) {
                        console.error('Error updating chat title:', titleError)
                        throw titleError
                    }

                    // Reload chat to get updated title
                    await loadChatData(activeId)
                }

                // Clear input and focus
                setInputValue('')
                onChange?.('')
                if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto'
                    textareaRef.current.focus()
                }

            } catch (error) {
                console.error('Chat error details:', {
                    error,
                    currentChat,
                    sessionId,
                    user: user?.id
                })
                const errorMessage = error instanceof Error ? error.message : 'An error occurred'
                toast.error(errorMessage)
                setProgress(0)
            } finally {
                setIsGenerating(false)
            }
        }
    }, [
        user,
        setShowAuthModal,
        inputValue,
        currentChat,
        sessionId,
        messages,
        setMessages,
        onChange,
        loadChatData,
        createChat,
        onSuccess
    ]);

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

    // Update chat title when first message is sent
    useEffect(() => {
        const updateChatTitle = async () => {
            // Title is now handled in handleSubmit
            console.log('Title update is now handled during message submission')
        }

        updateChatTitle()
    }, [messages, sessionId])

    return (
        <div className="w-full h-full flex flex-col">
            {/* Chat Messages - Scrollable Container */}
            <div className="flex-1 min-h-0 relative -mt-24">
                <div className="absolute inset-0 overflow-y-auto scrollbar-thin scrollbar-thumb-black/10 dark:scrollbar-thumb-white/10 hover:scrollbar-thumb-black/20 dark:hover:scrollbar-thumb-white/20 scrollbar-track-transparent">
                    <div className="flex flex-col justify-start min-h-full">
                        <div className="space-y-2">
                            <AnimatePresence initial={false}>
                                {messages.map((message) => (
                                    <motion.div
                                        key={message.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 500,
                                            damping: 30,
                                            mass: 1
                                        }}
                                        layout
                                        className={cn(
                                            "flex gap-2 items-start px-6 py-2",
                                            message.role === 'assistant' ? "justify-start" : "justify-end"
                                        )}
                                    >
                                        <motion.div
                                            layout
                                            className={cn(
                                                "inline-flex flex-col items-start px-4 py-2",
                                                "text-sm rounded-md max-w-[80%]",
                                                message.role === 'assistant'
                                                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                                    : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
                                                "shadow-sm hover:shadow-md transition-shadow duration-200"
                                            )}
                                        >
                                            <span className="relative flex h-2 w-2 mr-2">
                                                <span className={cn(
                                                    "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                                                    message.role === 'assistant'
                                                        ? "bg-blue-400"
                                                        : "bg-emerald-400"
                                                )} />
                                                <span className={cn(
                                                    "relative inline-flex rounded-full h-2 w-2",
                                                    message.role === 'assistant'
                                                        ? "bg-blue-500"
                                                        : "bg-emerald-500"
                                                )} />
                                            </span>
                                            <div className="flex flex-col w-full">
                                                <p className="whitespace-pre-wrap">{message.content}</p>
                                                {message.parameters?.modelUrl && (
                                                    <div className="mt-2 p-2 bg-black/5 dark:bg-white/5 rounded-md">
                                                        <p className="text-xs opacity-80">3D Model Ready</p>
                                                        <div className="mt-1 text-xs opacity-60">
                                                            Format: {message.parameters.format || 'GLB'}
                                                        </div>
                                                        {message.parameters.details && (
                                                            <div className="mt-1 text-xs opacity-60">
                                                                Size: {(message.parameters.details.size / 1024).toFixed(2)}KB
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                console.log('View Model clicked, URL:', message.parameters?.modelUrl?.substring(0, 100) + '...');
                                                                if (onSuccess && message.parameters?.modelUrl) {
                                                                    // Log the full URL for debugging
                                                                    console.log('Full model URL length:', message.parameters.modelUrl.length);
                                                                    console.log('Model URL format check:', {
                                                                        startsWithData: message.parameters.modelUrl.startsWith('data:'),
                                                                        includesBase64: message.parameters.modelUrl.includes('base64'),
                                                                        format: message.parameters.format
                                                                    });

                                                                    onSuccess({
                                                                        status: 'completed',
                                                                        message: 'Model loaded',
                                                                        modelUrl: message.parameters.modelUrl,
                                                                        format: message.parameters.format || 'glb',
                                                                        details: message.parameters.details
                                                                    });
                                                                }
                                                            }}
                                                            className="mt-2 text-xs px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 dark:bg-blue-500/20 dark:hover:bg-blue-500/30 rounded-md transition-colors duration-200"
                                                        >
                                                            View Model
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Input - Fixed at bottom */}
            <div className="flex-shrink-0 p-3 sticky bottom-0 bg-background/80 backdrop-blur-sm">
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
        </div>
    )
} 