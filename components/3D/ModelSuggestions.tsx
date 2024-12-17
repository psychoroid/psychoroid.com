'use client'

import { useMemo, useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/actions/utils"
import { useTranslation } from '@/lib/contexts/TranslationContext'
import { t } from '@/lib/i18n/translations'

interface ModelSuggestionsProps {
    onSelect: (suggestion: string) => void
}

interface StoredSuggestions {
    suggestions: string[]
    timestamp: number
    language: string
}

const FOUR_HOURS = 4 * 60 * 60 * 1000 // 4 hours in milliseconds

export function ModelSuggestions({ onSelect }: ModelSuggestionsProps) {
    const { currentLanguage } = useTranslation()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Get all suggestions from translations
    const allSuggestions = useMemo(() => {
        if (!mounted) return []
        const categories = Object.keys(t(currentLanguage, 'model_suggestions.items'))
        return categories.flatMap(category =>
            t(currentLanguage, `model_suggestions.items.${category}`) as string[]
        )
    }, [currentLanguage, mounted])

    // Get or generate random suggestions with persistence
    const randomSuggestions = useMemo(() => {
        if (!mounted) return []

        // Try to get stored suggestions
        const storedData = localStorage.getItem('modelSuggestions')
        if (storedData) {
            const stored: StoredSuggestions = JSON.parse(storedData)
            const isExpired = Date.now() - stored.timestamp > FOUR_HOURS
            const languageChanged = stored.language !== currentLanguage

            // Return stored suggestions if they're still valid
            if (!isExpired && !languageChanged) {
                return stored.suggestions
            }
        }

        // Generate new suggestions if needed
        const shuffled = [...allSuggestions].sort(() => 0.5 - Math.random())
        const newSuggestions = shuffled.slice(0, 4)

        // Store new suggestions
        const newStoredData: StoredSuggestions = {
            suggestions: newSuggestions,
            timestamp: Date.now(),
            language: currentLanguage
        }
        localStorage.setItem('modelSuggestions', JSON.stringify(newStoredData))

        return newSuggestions
    }, [allSuggestions, currentLanguage, mounted])

    if (!mounted) {
        return null
    }

    return (
        <div className="flex flex-wrap justify-center gap-2 max-w-[90%] mx-auto">
            {randomSuggestions.map((suggestion) => (
                <Button
                    key={suggestion}
                    variant="ghost"
                    onClick={() => onSelect(suggestion)}
                    type="button"
                    className={cn(
                        "h-6 rounded-none px-3 text-xs",
                        "bg-background/80 text-muted-foreground",
                        "hover:bg-background hover:text-foreground",
                        "border border-border/40",
                        "transition-colors duration-200",
                        "whitespace-nowrap"
                    )}
                >
                    {suggestion}
                </Button>
            ))}
        </div>
    )
} 