'use client';

import Link from 'next/link';
import { Twitter } from 'lucide-react';

export function Footer() {
    return (
        <nav className="bg-background/80 backdrop-blur-sm border-t border-border">
            <div className="max-w-7xl mx-auto px-8">
                <div className="flex items-center justify-end h-8">
                    <div className="flex items-center space-x-6 pr-12">
                        <Link
                            href="https://twitter.com/PrinceMuichkine"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Twitter className="h-3 w-3" />
                        </Link>
                        <div className="h-4 w-px bg-border"></div>
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
        </nav>
    );
} 