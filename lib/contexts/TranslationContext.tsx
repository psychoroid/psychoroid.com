'use client';

import React, { createContext, useContext, useState } from 'react';
import { Language, languages } from '../i18n/config';

type TranslationContextType = {
    currentLanguage: Language;
    setLanguage: (lang: Language) => void;
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: React.ReactNode }) {
    const [currentLanguage, setCurrentLanguage] = useState<Language>('en');

    const setLanguage = (lang: Language) => {
        setCurrentLanguage(lang);
        localStorage.setItem('preferred-language', lang);
    };

    return (
        <TranslationContext.Provider value={{ currentLanguage, setLanguage }}>
            {children}
        </TranslationContext.Provider>
    );
}

export const useTranslation = () => {
    const context = useContext(TranslationContext);
    if (context === undefined) {
        throw new Error('useTranslation must be used within a TranslationProvider');
    }
    return context;
}; 