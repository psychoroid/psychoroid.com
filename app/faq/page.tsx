'use client';

import { Navbar } from '@/components/design/Navbar';
import { Footer } from '@/components/design/Footer';
import { useTranslation } from '@/lib/contexts/TranslationContext';
import { t } from '@/lib/i18n/translations';

// Define types for our FAQ section structure
interface FAQSection {
    title: string;
    content: string;
}

interface FAQSections {
    [key: string]: FAQSection;
}

export default function FAQPage() {
    const { currentLanguage } = useTranslation();
    const sections = t(currentLanguage, 'faq.sections') as FAQSections;

    return (
        <div className="h-svh bg-background flex flex-col overflow-hidden">
            <Navbar />
            <div className="flex-grow overflow-auto scrollbar-hide">
                <div className="max-w-3xl mx-auto px-4 py-8 mt-16">
                    <div className="grid grid-cols-12 gap-8">
                        {/* Left side - Title */}
                        <div className="col-span-4">
                            <div className="flex flex-col space-y-2">
                                <h1 className="text-2xl font-medium tracking-tight text-foreground">
                                    {t(currentLanguage, 'faq.title')}
                                </h1>
                                <p className="text-sm text-muted-foreground/70">
                                    {t(currentLanguage, 'faq.subtitle')}
                                </p>
                            </div>
                        </div>

                        {/* Right side - Content */}
                        <div className="col-span-8 text-foreground">
                            {Object.entries(sections).map(([key, section]) => (
                                <section key={key} className="mb-12">
                                    <h2 className="text-base font-medium tracking-tight text-foreground mb-4">
                                        — {section.title}
                                    </h2>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {section.content}
                                    </p>
                                </section>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
} 