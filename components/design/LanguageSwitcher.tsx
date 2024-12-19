'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/lib/contexts/TranslationContext';
import { languages } from '@/lib/i18n/config';

export function LanguageSwitcher() {
    const [isOpen, setIsOpen] = useState(false);
    const { currentLanguage, setLanguage } = useTranslation();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentLangName = languages.find(l => l.code === currentLanguage)?.name;

    // Handle click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
                {currentLangName}
            </button>

            {isOpen && (
                <div className="absolute bottom-8 right-0 w-[140px] bg-background border border-border shadow-lg translate-x-16 z-[60]">
                    <div className="py-1">
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
                </div>
            )}
        </div>
    );
} 