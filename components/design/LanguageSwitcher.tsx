'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/contexts/TranslationContext';
import { languages } from '@/lib/i18n/config';

export function LanguageSwitcher() {
    const [isOpen, setIsOpen] = useState(false);
    const { currentLanguage, setLanguage } = useTranslation();

    const currentLangName = languages.find(l => l.code === currentLanguage)?.name;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
                {currentLangName}
            </button>

            {isOpen && (
                <div className="absolute bottom-full right-0 mb-2 bg-background border border-border rounded-none shadow-lg py-1 min-w-[120px]">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => {
                                setLanguage(lang.code);
                                setIsOpen(false);
                            }}
                            className={`w-full px-4 py-2 text-left text-xs hover:bg-muted transition-colors ${currentLanguage === lang.code ? 'text-foreground' : 'text-muted-foreground'}`}
                        >
                            {lang.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
} 