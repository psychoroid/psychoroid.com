import { useState, useEffect } from 'react';
import { AssetPreview } from './AssetPreview';
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
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    // Function to get full URL
    const getFullUrl = (path: string | undefined, type: 'model' | 'image') => {
        if (!path) return null;
        if (path.startsWith('http')) return path;

        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!baseUrl) return null;

        const bucket = type === 'model' ? 'product-models' : 'product-images';
        const cleanPath = path.replace(`${bucket}/`, '');
        return `${baseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`;
    };

    // Set up image URL
    useEffect(() => {
        if (imagePath) {
            const fullImageUrl = getFullUrl(imagePath, 'image');
            setImageUrl(fullImageUrl);
        }
    }, [imagePath]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowModel(true);
        }, index * 200);

        return () => clearTimeout(timer);
    }, [index]);

    const handleClick = () => {
        if (onClick) {
            const modelUrl = modelPath ? getFullUrl(modelPath, 'model') : null;
            onClick(imagePath || null, modelUrl);
        }
    };

    const handleGenerateMore = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = `/studio?prompt=${encodeURIComponent(description || '')}&image=${encodeURIComponent(imagePath || '')}`;
    };

    const renderPreview = () => {
        if (!showModel || !modelPath) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-accent/10">
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={title}
                            width={512}
                            height={512}
                            className="w-full h-full object-cover"
                            priority
                        />
                    ) : (
                        <Package className="w-8 h-8 text-muted-foreground" />
                    )}
                </div>
            );
        }

        return (
            <div className="w-full h-full relative">
                {/* Keep showing the image while model loads */}
                {imageUrl && (
                    <div className="absolute inset-0 z-0">
                        <Image
                            src={imageUrl}
                            alt={title}
                            width={512}
                            height={512}
                            className="w-full h-full object-cover"
                            priority
                        />
                    </div>
                )}
                <div className="relative z-10">
                    <AssetPreview
                        modelUrl={modelPath}
                        imageUrl={imagePath}
                        small
                        bucket={modelPath?.startsWith('default-assets/') ? 'default-assets' : 'product-models'}
                        canvasId={`asset-preview-${id}`}
                    />
                </div>
            </div>
        );
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
                        {renderPreview()}
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
                    {renderPreview()}
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