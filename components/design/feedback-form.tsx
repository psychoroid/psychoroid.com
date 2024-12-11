'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useUser } from '@/lib/contexts/UserContext'
import { supabase } from '@/lib/supabase/supabase'

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

        const { error } = await supabase.rpc('create_feedback', {
            p_merchant_id: user.id,
            p_sentiment: sentiment,
            p_message: feedback,
        })

        if (error) {
            console.error('Error submitting feedback:', error)
            return
        }

        setFeedback('')
        setSentiment('null')
        setIsOpen(false)
    }

    return (
        <div className="relative" ref={formRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
            >
                Feedback
            </button>
            {isOpen && (
                <div className="absolute bottom-8 right-0 w-80 bg-background border border-border shadow-lg">
                    <div className="p-4">
                        <Textarea
                            placeholder="Ideas or suggestions on how to improve our psychoroid..."
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
                                className="rounded-none"
                                disabled={!feedback.trim() || sentiment === 'null'}
                            >
                                Submit
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
