'use client';

import { useRef, useEffect } from 'react';
import { Download, Share2, Link2, FileJson, Code } from 'lucide-react';
import { XIcon } from '@/components/icons/XIcon';
import { toast } from "sonner";

interface CADActionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: {
        id: string;
        name: string;
        description?: string;
        model_path?: string;
    };
    onDownload?: (id: string) => void;
}

const EXPORT_FORMATS = {
    '3D & Gaming': [
        { name: 'GLB', ext: 'glb', desc: 'Standard 3D format' },
        { name: 'OBJ', ext: 'obj', desc: 'For 3D modeling' },
        { name: 'GLTF', ext: 'gltf', desc: 'For web & three.js' },
        { name: 'FBX', ext: 'fbx', desc: 'For 3D modeling (Coming Soon)', disabled: true },
    ],
    'CAD & Manufacturing': [
        { name: 'STL', ext: 'stl', desc: 'For 3D printing' },
        { name: 'STEP', ext: 'step', desc: 'For CAD software (Coming Soon)', disabled: true },
    ],
    'E-commerce & Web': [
        { name: 'USDZ', ext: 'usdz', desc: 'For Apple AR (Coming Soon)', disabled: true },
    ]
};

const SHARE_OPTIONS = {
    'Socials': [
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
    'Developers': [
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

export function CADActionsModal({ isOpen, onClose, product, onDownload }: CADActionsModalProps) {
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

    const handleDownload = async (format: string) => {
        // Reuse download logic from DownloadModal
        toast.success(`Downloading ${format.toUpperCase()} file`);
        onDownload?.(product.id);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
            <div
                ref={modalRef}
                className="bg-background border border-border shadow-lg w-[300px] max-h-[600px] overflow-y-auto scrollbar-hide"
            >
                {/* Download Section */}
                <div className="border-b border-border">
                    <div className="p-4 border-b border-border">
                        <h3 className="font-medium text-sm">Download</h3>
                    </div>
                    <div className="p-2">
                        {Object.entries(EXPORT_FORMATS).map(([category, formats]) => (
                            <div key={category} className="mb-4">
                                <h4 className="text-xs font-medium text-muted-foreground px-2 mb-1">
                                    {category}
                                </h4>
                                <div className="space-y-1">
                                    {formats.map((format) => (
                                        <button
                                            key={format.ext}
                                            onClick={() => !format.disabled && handleDownload(format.ext)}
                                            className={`w-full text-left px-2 py-1.5 hover:bg-accent text-sm flex items-center justify-between group ${format.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            disabled={format.disabled}
                                        >
                                            <div>
                                                <span className="font-medium">{format.name}</span>
                                                <span className="text-xs text-muted-foreground ml-2">
                                                    {format.desc}
                                                </span>
                                            </div>
                                            {!format.disabled && (
                                                <Download className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Share Section */}
                <div>
                    <div className="p-4 border-b border-border">
                        <h3 className="font-medium text-sm">Share</h3>
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
        </div>
    );
} 