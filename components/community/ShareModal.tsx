'use client';

import { useRef, useEffect } from 'react';
import { Share2, Link2, FileJson, Code } from 'lucide-react';
import { XIcon } from '@/components/icons/XIcon';
import { toast } from "sonner";

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: {
        id: string;
        name: string;
        description: string;
    };
}

const SHARE_OPTIONS = {
    'Quick Share': [
        {
            name: 'Copy link',
            icon: Link2,
            action: (url: string) => {
                navigator.clipboard.writeText(url);
                toast.success('Link copied to clipboard');
            }
        },
        {
            name: 'x.com',
            icon: XIcon,
            action: (url: string, title: string) => {
                window.open(`https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
            }
        }
    ],
    'Developer Tools': [
        {
            name: 'API endpoint',
            icon: FileJson,
            action: (url: string, title: string) => {
                const apiUrl = `${window.location.origin}/api/v1/products/${title.toLowerCase().replace(/\s+/g, '-')}`;
                navigator.clipboard.writeText(apiUrl);
                toast.success('API endpoint copied to clipboard');
            }
        },
        {
            name: 'Embed code',
            icon: Code,
            action: (url: string, title: string) => {
                const embedCode = `<iframe src="${url}/embed" width="100%" height="400" frameborder="0"></iframe>`;
                navigator.clipboard.writeText(embedCode);
                toast.success('Embed code copied to clipboard');
            }
        }
    ]
};

export function ShareModal({ isOpen, onClose, product }: ShareModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const productUrl = `${window.location.origin}/community/${product.id}`;

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
            <div
                ref={modalRef}
                className="bg-background border border-border shadow-lg w-[300px] max-h-[400px] overflow-y-auto"
            >
                <div className="p-4 border-b border-border">
                    <h3 className="font-medium text-sm">Share this asset</h3>
                </div>

                <div className="p-2">
                    {Object.entries(SHARE_OPTIONS).map(([category, options]) => (
                        <div key={category} className="mb-4">
                            <h4 className="text-xs font-medium text-muted-foreground px-2 mb-1">
                                {category}
                            </h4>
                            <div className="space-y-1">
                                {options.map((option) => (
                                    <button
                                        key={option.name}
                                        onClick={() => option.action(productUrl, product.name)}
                                        className="w-full text-left px-2 py-1.5 hover:bg-accent text-sm flex items-center justify-between group"
                                    >
                                        <span className="font-medium flex items-center gap-2">
                                            <option.icon className="w-4 h-4" />
                                            {option.name}
                                        </span>
                                        <Share2 className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
} 