'use client';

import Link from 'next/link';
import FeedbackForm from './feedback-form';
import { XIcon } from '@/components/icons/XIcon';
import { GitHubIcon } from '@/components/icons/GitHubIcon';
import { DiscordIcon } from '@/components/icons/DiscordIcon';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from '@/lib/contexts/TranslationContext';
import { t } from '@/lib/i18n/translations';
import { PHIcon } from '@/components/icons/PHIcon';
import { cn } from '@/lib/actions/utils';

export function Footer({ className }: { className?: string }) {
    const { currentLanguage } = useTranslation();

    return (
        <nav className={cn("bg-background/80 backdrop-blur-sm border-t border-border relative z-50", className)}>
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="flex items-center justify-end h-8">
                    <div className="hidden lg:flex items-center text-xs text-muted-foreground">
                        {t(currentLanguage, 'footer.copyright')}
                        <div className="h-4 w-px bg-border mx-4" />
                        <Link
                            href="/blog"
                            className="text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
                        >
                            {t(currentLanguage, 'footer.blog')}
                        </Link>
                        <div className="h-4 w-px bg-border mx-4" />
                        <FeedbackForm />
                        <div className="h-4 w-px bg-border mx-4" />
                        <Link
                            href="https://www.producthunt.com/products/psychoroid-com/reviews"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors text-xs"
                        >
                            {t(currentLanguage, 'footer.recommend')}
                        </Link>
                        <div className="h-4 w-px bg-border mx-4" />
                        <span className="text-muted-foreground text-sm -translate-y-[1px] mr-1">›</span>
                        <LanguageSwitcher />
                    </div>
                    <div className="flex items-center space-x-6 py-2 lg:py-0 ml-auto">
                        <Link
                            href="https://github.com/psychoroid"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <GitHubIcon className="h-3 w-3 -translate-y-[2px]" />
                        </Link>
                        <div className="h-4 w-px bg-border"></div>
                        <Link
                            href="https://www.producthunt.com/products/psychoroid-com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <PHIcon className="h-4 w-4 fill-current -translate-y-[1.5px]" />
                        </Link>
                        <div className="h-4 w-px bg-border"></div>
                        <Link
                            href="https://discord.gg/hVFZ3Wq2Hh"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <DiscordIcon className="h-4 w-4 -translate-y-[1px]" />
                        </Link>
                        <div className="h-4 w-px bg-border"></div>
                        <Link
                            href="https://x.com/psychoroidx"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <XIcon className="h-3.5 w-3.5 fill-current -translate-y-[0.5px]" />
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
                            <div className="h-4 w-px bg-border hidden lg:block"></div>
                            <div className="hidden lg:block">
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
            </div>
        </nav>
    );
} 