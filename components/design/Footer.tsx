'use client';

import Link from 'next/link';

export function Footer() {
    return (
        <nav className="bg-background/80 backdrop-blur-sm border-t border-border">
            <div className="max-w-7xl mx-auto px-8">
                <div className="flex items-center justify-end h-8">
                    <div className="flex items-center space-x-6 pr-12">
                        <Link
                            href="/privacy"
                            className="text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
                        >
                            Privacy
                        </Link>
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