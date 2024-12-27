'use client'

import { useMemo, useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/actions/utils"
import { useTranslation } from '@/lib/contexts/TranslationContext'
import { t } from '@/lib/i18n/translations'

interface ModelSuggestionsProps {
    onSelect: (suggestion: string) => void
}

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

    // Generate random suggestions on every render
    const randomSuggestions = useMemo(() => {
        if (!mounted || allSuggestions.length === 0) return []
        return [...allSuggestions]
            .sort(() => 0.5 - Math.random())
            .slice(0, 3)
    }, [mounted, allSuggestions])

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