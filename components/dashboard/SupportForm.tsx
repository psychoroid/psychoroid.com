'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ImagePlus, X } from "lucide-react"
import { useUser } from '@/lib/contexts/UserContext'
import { supabase } from '@/lib/supabase/supabase'
import { toast } from 'sonner'

const categories = [
    { value: 'account', label: 'Account Issues' },
    { value: 'billing', label: 'Billing Questions' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'other', label: 'Other' }
]

interface SelectOption {
    value: string
    label: string
}

interface CustomSelectProps {
    value: string
    onChange: (value: string) => void
    options: SelectOption[]
}

const CustomSelect = ({ value, onChange, options }: CustomSelectProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const selectRef = useRef<HTMLDivElement>(null)

    return (
        <div ref={selectRef} className="relative">
            <div
                className="bg-background text-foreground p-2 cursor-pointer border border-input rounded-none text-sm"
                onClick={() => setIsOpen(!isOpen)}
            >
                {value ? options.find((opt: SelectOption) => opt.value === value)?.label : 'Select a category'}
            </div>
            {isOpen && (
                <div className="absolute top-full left-0 w-full bg-background border border-input mt-1 z-10 text-sm rounded-none">
                    {options.map((option: SelectOption) => (
                        <div
                            key={option.value}
                            className="p-2 hover:bg-accent cursor-pointer"
                            onClick={() => {
                                onChange(option.value)
                                setIsOpen(false)
                            }}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default function SupportForm() {
    const { user } = useUser()
    const [category, setCategory] = useState('')
    const [message, setMessage] = useState('')
    const [image, setImage] = useState<File | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleSubmit = async () => {
        if (!user) {
            console.error('User not found')
            return
        }

        if (!category) {
            toast.error('Please select a category')
            return
        }

        if (!message.trim()) {
            toast.error('Please enter a message')
            return
        }

        setIsLoading(true)
        try {
            let imageUrl: string | null = null
            let imagePath: string | null = null

            if (image) {
                const sanitizedFileName = image.name.replace(/[^a-zA-Z0-9.-]/g, '_')
                const filePath = `${user.id}/${Date.now()}_${sanitizedFileName}`

                const { error: uploadError } = await supabase.storage
                    .from('support-request-images')
                    .upload(filePath, image)

                if (uploadError) throw uploadError

                const { data: urlData } = await supabase.storage
                    .from('support-request-images')
                    .getPublicUrl(filePath)

                imageUrl = urlData.publicUrl
                imagePath = filePath
            }

            const { error } = await supabase
                .from('support_requests')
                .insert({
                    user_id: user.id,
                    category,
                    message,
                    image_url: imageUrl,
                    image_path: imagePath
                })

            if (error) throw error

            toast.success('Support request submitted successfully')
            setCategory('')
            setMessage('')
            setImage(null)
        } catch (error) {
            console.error('Error submitting support request:', error)
            toast.error('Failed to submit support request')
        } finally {
            setIsLoading(false)
        }
    }

    const handleImageUpload = (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file')
            return
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error('Image size should be less than 5MB')
            return
        }

        setImage(file)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) handleImageUpload(file)
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-2">
                <label className="text-sm font-medium">Category</label>
                <CustomSelect
                    value={category}
                    onChange={setCategory}
                    options={categories}
                />
            </div>

            <div className="grid gap-2">
                <label className="text-sm font-medium">Message</label>
                <div
                    className={`relative ${isDragging ? 'bg-accent/50' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <Textarea
                        placeholder="How can we help you?"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="min-h-[100px] text-sm pr-8 rounded-none resize-none"
                    />
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleImageUpload(file)
                        }}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute bottom-2 right-2 rounded-none"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <ImagePlus className="h-4 w-4" />
                    </Button>
                </div>
                {isDragging && (
                    <div className="absolute inset-0 border-2 border-dashed border-accent pointer-events-none" />
                )}
            </div>

            {image && (
                <div className="flex items-center gap-2 p-2 bg-accent/50">
                    <span className="text-xs text-muted-foreground flex-1 truncate">
                        {image.name}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setImage(null)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <Button
                onClick={handleSubmit}
                disabled={isLoading || !category || !message.trim()}
                className="w-full rounded-none"
            >
                {isLoading ? 'Submitting...' : 'Submit Ticket'}
            </Button>
        </div>
    )
}
