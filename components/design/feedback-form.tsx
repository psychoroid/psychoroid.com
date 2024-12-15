'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useUser } from '@/lib/contexts/UserContext'
import { supabase } from '@/lib/supabase/supabase'
import { toast } from 'react-hot-toast'
import { useTranslation } from '@/lib/contexts/TranslationContext'
import { t } from '@/lib/i18n/translations'

type Sentiment = 'very_positive' | 'positive' | 'negative' | 'very_negative' | 'null'

const emojis: { [key in Sentiment]: string } = {
    very_positive: '😀',
    positive: '🙂',
    negative: '🙁',
    very_negative: '😞',
    'null': ''
}

export default function FeedbackForm() {
    const { user } = useUser()
    const { currentLanguage } = useTranslation()
    const [isOpen, setIsOpen] = useState(false)
    const [feedback, setFeedback] = useState('')
    const [sentiment, setSentiment] = useState<Sentiment>('null')
    const formRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (formRef.current && !formRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const handleSubmit = async () => {
        if (!user?.id) return

        try {
            const { error } = await supabase.rpc('create_feedback', {
                p_sentiment: sentiment,
                p_message: feedback
            })

            if (error) throw error

            toast.success('Feedback submitted successfully')
            setFeedback('')
            setSentiment('null')
            setIsOpen(false)
        } catch (error) {
            console.error('Error submitting feedback:', error)
            toast.error('Failed to submit feedback')
        }
    }

    return (
        <div className="relative" ref={formRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
            >
                {t(currentLanguage, 'feedback_form.button')}
            </button>
            {isOpen && (
                <div className="absolute bottom-8 right-0 w-80 bg-background border border-border shadow-lg translate-x-12">
                    <div className="p-4">
                        <Textarea
                            placeholder={t(currentLanguage, 'feedback_form.placeholder')}
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="min-h-[100px] mb-4 text-xs placeholder:text-xs bg-background rounded-none resize-none"
                        />
                        <div className="flex items-center justify-between">
                            <div className="flex space-x-2">
                                {(Object.keys(emojis) as Sentiment[])
                                    .filter(key => key !== 'null')
                                    .map((key) => (
                                        <button
                                            key={key}
                                            onClick={() => setSentiment(key)}
                                            className={`text-lg p-1 ${sentiment === key ? 'bg-accent' : ''}`}
                                        >
                                            {emojis[key]}
                                        </button>
                                    ))}
                            </div>
                            <Button
                                size="sm"
                                onClick={handleSubmit}
                                className="rounded-none bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white"
                                disabled={!feedback.trim() || sentiment === 'null'}
                            >
                                {t(currentLanguage, 'feedback_form.submit')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
