import React, { useEffect, useState } from 'react'
import { useTranslation } from '@/lib/contexts/TranslationContext'
import { translateToEnglish, needsTranslation } from '@/lib/huggingface/translation'

interface PromptTranslatorProps {
    originalPrompt: string
    onTranslatedPrompt: (translatedPrompt: string) => void
    className?: string
    sourceLang: string
}

export const PromptTranslator: React.FC<PromptTranslatorProps> = ({
    originalPrompt,
    onTranslatedPrompt,
    sourceLang
}) => {
    useEffect(() => {
        const translatePrompt = async () => {
            if (!originalPrompt || !needsTranslation(originalPrompt)) {
                onTranslatedPrompt(originalPrompt)
                return
            }

            try {
                const translated = await translateToEnglish(originalPrompt, sourceLang)
                onTranslatedPrompt(translated)
            } catch (err) {
                console.error('Translation failed:', err)
                onTranslatedPrompt(originalPrompt)
            }
        }

        translatePrompt()
    }, [originalPrompt, sourceLang, onTranslatedPrompt])

    // No visual rendering, just translation logic
    return null
} 