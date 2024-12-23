'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ImagePlus, X } from "lucide-react"
import { useUser } from '@/lib/contexts/UserContext'
import { supabase } from '@/lib/supabase/supabase'
import { useTranslation } from '@/lib/contexts/TranslationContext'
import { t } from '@/lib/i18n/translations'
import { toast } from 'sonner'

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
    const { currentLanguage } = useTranslation()

    return (
        <div ref={selectRef} className="relative w-fit">
            <div
                className="bg-background text-foreground p-2 cursor-pointer border border-input rounded-none text-sm min-w-[140px]"
                onClick={() => setIsOpen(!isOpen)}
            >
                {value ? options.find((opt: SelectOption) => opt.value === value)?.label : t(currentLanguage, 'ui.support.form.select_category')}
            </div>
            {isOpen && (
                <div className="absolute top-full left-0 w-full bg-background border border-input mt-1 z-10 text-sm rounded-none">
                    {options.map((option: SelectOption) => (
                        <div
                            key={option.value}
                            className="p-2 hover:bg-accent cursor-pointer whitespace-nowrap"
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
    const { currentLanguage } = useTranslation()
    const [category, setCategory] = useState('')
    const [message, setMessage] = useState('')
    const [image, setImage] = useState<File | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const categories = [
        { value: 'account', label: t(currentLanguage, 'ui.support.categories.account') },
        { value: 'billing', label: t(currentLanguage, 'ui.support.categories.billing') },
        { value: 'technical', label: t(currentLanguage, 'ui.support.categories.technical') },
        { value: 'other', label: t(currentLanguage, 'ui.support.categories.other') }
    ]

    const handleSubmit = async () => {
        if (!user) {
            console.error('User not found')
            toast.error(t(currentLanguage, 'ui.support.errors.user_not_found'))
            return
        }

        if (!category) {
            toast.error(t(currentLanguage, 'ui.support.errors.category_required'))
            return
        }

        if (!message.trim()) {
            toast.error(t(currentLanguage, 'ui.support.errors.message_required'))
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

            const { data, error } = await supabase.rpc('create_support_request', {
                p_category: category,
                p_message: message,
                p_image_url: imageUrl,
                p_image_path: imagePath
            })

            if (error) throw error

            toast.success(t(currentLanguage, 'ui.support.success.submitted'))
            setCategory('')
            setMessage('')
            setImage(null)
        } catch (error) {
            console.error('Error submitting support request:', error)
            toast.error(t(currentLanguage, 'ui.support.errors.submit_failed'))
        } finally {
            setIsLoading(false)
        }
    }

    const handleImageUpload = (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error(t(currentLanguage, 'ui.support.form.image.invalid_type'))
            return
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error(t(currentLanguage, 'ui.support.form.image.size_limit'))
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
                <label className="text-sm font-medium">{t(currentLanguage, 'ui.support.form.category')}</label>
                <CustomSelect
                    value={category}
                    onChange={setCategory}
                    options={categories}
                />
            </div>

            <div className="grid gap-2">
                <label className="text-sm font-medium">{t(currentLanguage, 'ui.support.form.message')}</label>
                <div
                    className={`relative ${isDragging ? 'bg-accent/50' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <Textarea
                        placeholder={t(currentLanguage, 'ui.support.form.message_placeholder')}
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
                        title={t(currentLanguage, 'ui.support.form.image.upload_prompt')}
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
                disabled={isLoading}
                className="rounded-none bg-emerald-500 hover:bg-emerald-600 text-white h-9 px-4 sm:h-10 sm:px-6 w-full sm:w-auto"
            >
                {isLoading
                    ? t(currentLanguage, 'ui.support.form.submitting')
                    : t(currentLanguage, 'ui.support.form.submit')
                }
            </Button>
        </div>
    )
}
