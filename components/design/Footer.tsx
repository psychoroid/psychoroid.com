'use client';

import Link from 'next/link';
import { Github } from 'lucide-react';
import FeedbackForm from './feedback-form';
import { XIcon } from '@/components/icons/XIcon';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from '@/lib/contexts/TranslationContext';
import { t } from '@/lib/i18n/translations';
import { PHIcon } from '@/components/icons/PHIcon';

export function Footer() {
    const { currentLanguage } = useTranslation();

    return (
        <nav className="bg-background/80 backdrop-blur-sm border-t border-border">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="flex items-center justify-end h-8">
                    <div className="hidden md:flex items-center text-xs text-muted-foreground">
                        {t(currentLanguage, 'footer.copyright')}
                        <div className="h-4 w-px bg-border mx-4" />
                        <FeedbackForm />
                        <div className="h-4 w-px bg-border mx-4" />
                        <LanguageSwitcher />
                    </div>
                    <div className="flex items-center space-x-6 py-2 md:py-0 ml-auto">
                        <Link
                            href="https://github.com/psychoroid"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Github className="h-3 w-3" />
                        </Link>
                        <div className="h-4 w-px bg-border"></div>
                        <Link
                            href="https://producthunt.com/@psychoroid"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <PHIcon className="h-4 w-4 fill-current -translate-y-[1px]" />
                        </Link>
                        <div className="h-4 w-px bg-border"></div>
                        <Link
                            href="https://x.com/psychoroidx"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <XIcon className="h-3 w-3 fill-current" />
                        </Link>
                        <div className="h-4 w-px bg-border"></div>
                        <div className="flex items-center space-x-6">
                            <Link
                                href="/faq"
                                className="text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
                            >
                                {t(currentLanguage, 'footer.faq')}
                            </Link>
                            <div className="h-4 w-px bg-border"></div>
                            <Link
                                href="/privacy"
                                className="text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
                            >
                                {t(currentLanguage, 'footer.privacy')}
                            </Link>
                            <div className="h-4 w-px bg-border"></div>
                            <Link
                                href="/terms"
                                className="text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
                            >
                                {t(currentLanguage, 'footer.terms')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
} 