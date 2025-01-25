'use client';

import { useRef, useState, useEffect } from 'react';
import { Send, Loader2, Image as ImageIcon, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from "@/lib/actions/utils";
import { motion, AnimatePresence } from 'framer-motion';

interface CADInputProps {
    onSubmit: (content: string, attachments?: File[]) => Promise<void>;
    isLoading?: boolean;
    placeholder?: string;
    showAttachments?: boolean;
    className?: string;
    disabled?: boolean;
}

export function CADInput({
    onSubmit,
    isLoading = false,
    placeholder = "Describe what you want to create...",
    showAttachments = true,
    className,
    disabled = false
}: CADInputProps) {
    const [content, setContent] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
        }
    }, [content]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (content.trim() || attachments.length > 0) {
            await onSubmit(content, attachments);
            setContent('');
            setAttachments([]);
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setAttachments(prev => [...prev, ...files]);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        setAttachments(prev => [...prev, ...files]);
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <form
            onSubmit={handleSubmit}
            className={cn(
                "relative flex flex-col gap-2 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
                className
            )}
            onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
        >
            <AnimatePresence>
                {attachments.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="flex flex-wrap gap-2 p-2 border-b"
                    >
                        {attachments.map((file, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 bg-muted rounded-md p-1 pr-2 text-xs"
                            >
                                <ImageIcon className="h-4 w-4" />
                                <span className="max-w-[100px] truncate">{file.name}</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 p-0"
                                    onClick={() => removeAttachment(index)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-end gap-2 p-4">
                {showAttachments && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled || isLoading}
                    >
                        <Paperclip className="h-4 w-4" />
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleFileSelect}
                            disabled={disabled || isLoading}
                        />
                    </Button>
                )}

                <Textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="min-h-[40px] w-full resize-none bg-transparent px-4 py-[0.6rem] focus-within:outline-none sm:text-sm"
                    disabled={disabled || isLoading}
                    rows={1}
                />

                <Button
                    type="submit"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    disabled={(!content.trim() && attachments.length === 0) || disabled || isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </Button>
            </div>

            <AnimatePresence>
                {isDragging && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur"
                    >
                        <div className="rounded-lg border-2 border-dashed border-primary/50 p-8 text-center">
                            <p className="text-sm text-muted-foreground">Drop files here to attach</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </form>
    );
} 