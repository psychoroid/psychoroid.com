'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Box, History, Download, Code, Send, Loader2 } from 'lucide-react'
import { cn } from "@/lib/actions/utils"
import { motion } from 'framer-motion'
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useTheme } from 'next-themes'

interface CADMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    parameters?: any
}

interface CADChatProps {
    onPromptSubmit?: (prompt: string) => Promise<void>
    showPreview?: boolean
    user?: any
    setShowAuthModal?: (show: boolean) => void
    value?: string
    onChange?: (value: string) => void
    isLoading?: boolean
    messages?: CADMessage[]
}

export function CADChat({
    onPromptSubmit,
    showPreview = false,
    user,
    setShowAuthModal,
    value,
    onChange,
    isLoading,
    messages = []
}: CADChatProps) {
    const [inputValue, setInputValue] = useState(value || '')
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const { theme } = useTheme()

    // Update internal value when external value changes
    useEffect(() => {
        if (value !== undefined) {
            setInputValue(value)
        }
    }, [value])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!user && setShowAuthModal) {
            setShowAuthModal(true)
            return
        }

        if (inputValue.trim() && onPromptSubmit && !showPreview && !isLoading) {
            await onPromptSubmit(inputValue)
            setInputValue('')
            onChange?.('')
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !showPreview) {
            e.preventDefault()
            handleSubmit(e)
        }

        if (e.nativeEvent.isComposing) {
            return
        }
    }

    return (
        <div className="flex flex-col w-full">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-6 p-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={cn(
                            "flex items-start gap-4 p-4 rounded-lg",
                            message.role === 'assistant' ? "bg-muted/50" : "bg-primary/5"
                        )}
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            message.role === 'assistant' ? "bg-primary" : "bg-secondary"
                        )}>
                            {message.role === 'assistant' ? (
                                <Box className="w-4 h-4 text-primary-foreground" />
                            ) : (
                                <div className="w-4 h-4 bg-secondary-foreground rounded-full" />
                            )}
                        </div>
                        <div className="flex-1 space-y-2">
                            <p className="text-sm font-medium">
                                {message.role === 'assistant' ? 'CAD Assistant' : 'You'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {message.content}
                            </p>
                            {message.parameters && (
                                <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                                    {JSON.stringify(message.parameters, null, 2)}
                                </pre>
                            )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {message.timestamp.toLocaleTimeString()}
                        </span>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center gap-2 p-4">
                    <Textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={(e) => {
                            if (!showPreview) {
                                setInputValue(e.target.value)
                                onChange?.(e.target.value)
                            }
                        }}
                        onKeyDown={handleKeyDown}
                        disabled={showPreview || isLoading}
                        placeholder="Describe what you want to create..."
                        className="min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        rows={1}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!inputValue.trim() || showPreview || isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
} 