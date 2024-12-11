'use client';

import Link from 'next/link';
import { Twitter, Github } from 'lucide-react';
import FeedbackForm from './feedback-form';

export function Footer() {
    return (
        <nav className="bg-background/80 backdrop-blur-sm border-t border-border">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="flex items-center justify-end h-8">
                    <div className="hidden md:flex items-center text-xs text-muted-foreground">
                        Copyright © 2025 — psychoroid.com
                        <div className="h-4 w-px bg-border mx-4" />
                        <FeedbackForm />
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
                            href="https://x.com/bm_diop"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Twitter className="h-3 w-3" />
                        </Link>
                        <div className="h-4 w-px bg-border"></div>
                        <div className="flex items-center space-x-6">
                            <Link
                                href="/faq"
                                className="text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
                            >
                                FAQ
                            </Link>
                            <div className="h-4 w-px bg-border"></div>
                            <Link
                                href="/privacy"
                                className="text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
                            >
                                Privacy
                            </Link>
                            <div className="h-4 w-px bg-border"></div>
                            <Link
                                href="/terms"
                                className="text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
                            >
                                Terms
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
} 