'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, languages } from '../i18n/config';

interface TranslationContextType {
    currentLanguage: Language;
    setLanguage: (lang: Language) => void;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: React.ReactNode }) {
    const [currentLanguage, setCurrentLanguage] = useState<Language>('en');

    useEffect(() => {
        // Get language from localStorage or browser preference
        const storedLang = localStorage.getItem('language') as Language;
        const browserLang = navigator.language.split('-')[0] as Language;
        const supportedLangs = languages.map(l => l.code);

        const defaultLang = storedLang ||
            (supportedLangs.includes(browserLang) ? browserLang : 'en');

        setCurrentLanguage(defaultLang);
    }, []);

    const setLanguage = (lang: Language) => {
        setCurrentLanguage(lang);
        localStorage.setItem('language', lang);
    };

    return (
        <TranslationContext.Provider value={{ currentLanguage, setLanguage }}>
            {children}
        </TranslationContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(TranslationContext);
    if (context === undefined) {
        throw new Error('useTranslation must be used within a TranslationProvider');
    }
    return context;
} 