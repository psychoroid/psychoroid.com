import { useState, useEffect } from 'react';
import { ModelPreview } from './ModelPreview';
import { Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/actions/utils";
import { Plus } from 'lucide-react';
import Image from 'next/image';

interface AssetCardProps {
    id: string;
    title: string;
    description?: string;
    modelPath?: string;
    imagePath?: string;
    onClick: (imagePath: string | null, modelUrl: string | null) => void;
    index: number;
    layout: 'grid' | 'stack';
}

export function AssetCard({
    id,
    title,
    description,
    modelPath,
    imagePath,
    onClick,
    index,
    layout
}: AssetCardProps) {
    const [showModel, setShowModel] = useState(false);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowModel(true);
        }, index * 200);

        return () => clearTimeout(timer);
    }, [index]);

    const handleClick = () => {
        if (onClick) {
            // Only handle product-models bucket URLs
            const modelUrl = modelPath?.startsWith('http')
                ? modelPath
                : modelPath
                    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-models/${modelPath}`
                    : null;
            onClick(imagePath || null, modelUrl);
        }
    };

    const handleGenerateMore = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = `/studio?prompt=${encodeURIComponent(description || '')}&image=${encodeURIComponent(imagePath || '')}`;
    };

    if (layout === 'stack') {
        return (
            <div className="flex flex-col gap-2 group border border-border bg-card/50 p-2 hover:bg-accent/50">
                {/* Description - At the top */}
                <div className="w-full">
                    <h3 className="text-sm font-medium truncate">{title}</h3>
                    {description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {description}
                        </p>
                    )}
                </div>

                {/* Preview and Generate More Container */}
                <div className="flex items-center gap-4">
                    {/* Model Preview Container - Smaller for stack view */}
                    <div
                        className={cn(
                            "w-24 h-24 bg-card/50 border border-border flex-shrink-0 cursor-pointer",
                            "group-hover:border-primary/50 transition-colors duration-200"
                        )}
                        onClick={handleClick}
                    >
                        {modelPath && showModel ? (
                            <div className="w-full h-full relative">
                                <ModelPreview
                                    modelUrl={modelPath}
                                    imageUrl={imagePath}
                                    small
                                    bucket={modelPath.startsWith('default-assets/') ? 'default-assets' : 'product-models'}
                                    canvasId={`asset-preview-${id}`}
                                />
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-accent/10">
                                <Package className="w-8 h-8 text-muted-foreground" />
                            </div>
                        )}
                    </div>

                    {/* Generate More Button */}
                    <div
                        className="w-24 h-24 border border-dashed border-border flex items-center justify-center hover:border-primary hover:bg-accent/50 transition-colors duration-200 cursor-pointer"
                        onClick={handleGenerateMore}
                    >
                        <Plus className="w-8 h-8 text-muted-foreground hover:text-primary transition-colors duration-200" />
                    </div>
                </div>
            </div>
        );
    }

    // Grid layout (default)
    return (
        <div className="flex flex-col gap-2 group">
            {/* Description - At the top */}
            <div className="space-y-1">
                <h3 className="text-sm font-medium truncate">{title}</h3>
                {description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                        {description}
                    </p>
                )}
            </div>

            {/* Preview and Generate More Container */}
            <div className="flex gap-2">
                {/* Model Preview Container */}
                <div
                    className={cn(
                        "aspect-square w-full bg-card/50 border border-border cursor-pointer",
                        "group-hover:border-primary/50 transition-colors duration-200"
                    )}
                    onClick={handleClick}
                >
                    {modelPath && showModel ? (
                        <div className="w-full h-full relative">
                            <ModelPreview
                                modelUrl={modelPath}
                                imageUrl={imagePath}
                                small
                                bucket={modelPath.startsWith('default-assets/') ? 'default-assets' : 'product-models'}
                                canvasId={`asset-preview-${id}`}
                            />
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-accent/10">
                            <Package className="w-12 h-12 text-muted-foreground" />
                        </div>
                    )}
                </div>

                {/* Generate More Button */}
                <div
                    className="aspect-square w-24 border border-dashed border-border flex items-center justify-center hover:border-primary hover:bg-accent/50 transition-colors duration-200 cursor-pointer"
                    onClick={handleGenerateMore}
                >
                    <Plus className="w-8 h-8 text-muted-foreground hover:text-primary transition-colors duration-200" />
                </div>
            </div>
        </div>
    );
} 