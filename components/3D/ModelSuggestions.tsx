'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
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
    version: number
}

const REFRESH_INTERVAL = 1 * 60 * 60 * 1000 // 1 hour in milliseconds
const CURRENT_VERSION = 2 // Increment this when suggestions are updated

export function ModelSuggestions({ onSelect }: ModelSuggestionsProps) {
    const { currentLanguage } = useTranslation()
    const [mounted, setMounted] = useState(false)
    const [lastRefresh, setLastRefresh] = useState<number>(Date.now())

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

    // Function to generate new suggestions
    const generateNewSuggestions = useCallback(() => {
        const shuffled = [...allSuggestions].sort(() => 0.5 - Math.random())
        const newSuggestions = shuffled.slice(0, 3)

        const newStoredData: StoredSuggestions = {
            suggestions: newSuggestions,
            timestamp: Date.now(),
            language: currentLanguage,
            version: CURRENT_VERSION
        }
        localStorage.setItem('modelSuggestions', JSON.stringify(newStoredData))
        setLastRefresh(Date.now())

        return newSuggestions
    }, [allSuggestions, currentLanguage])

    // Get or generate random suggestions with persistence
    const randomSuggestions = useMemo(() => {
        if (!mounted) return []

        try {
            // Try to get stored suggestions
            const storedData = localStorage.getItem('modelSuggestions')
            if (storedData) {
                const stored: StoredSuggestions = JSON.parse(storedData)
                const isExpired = Date.now() - stored.timestamp > REFRESH_INTERVAL
                const languageChanged = stored.language !== currentLanguage
                const isOldVersion = !stored.version || stored.version < CURRENT_VERSION

                // Return stored suggestions if they're still valid
                if (!isExpired && !languageChanged && !isOldVersion && stored.suggestions.length === 3) {
                    return stored.suggestions
                }
            }
        } catch (error) {
            console.error('Error reading stored suggestions:', error)
        }

        // Generate new suggestions if needed
        return generateNewSuggestions()
    }, [mounted, currentLanguage, generateNewSuggestions])

    // Auto-refresh suggestions periodically
    useEffect(() => {
        const interval = setInterval(() => {
            generateNewSuggestions()
        }, REFRESH_INTERVAL)

        return () => clearInterval(interval)
    }, [generateNewSuggestions])

    if (!mounted) {
        return null
    }

    return (
        <div className="flex flex-wrap justify-center gap-3 sm:gap-2 max-w-[95%] sm:max-w-[90%] mx-auto">
            {randomSuggestions.map((suggestion) => (
                <Button
                    key={suggestion}
                    variant="ghost"
                    onClick={() => onSelect(suggestion)}
                    type="button"
                    className={cn(
                        "h-8 sm:h-6 rounded-none px-4 sm:px-3 text-sm sm:text-xs",
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