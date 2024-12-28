import { memo } from 'react';
import { ModelPreview } from './LibraryModelPreview';
import { Package, Plus } from 'lucide-react';
import { cn } from "@/lib/actions/utils";

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

export const AssetCard = memo(function AssetCard({
    id,
    title,
    description,
    modelPath,
    imagePath,
    onClick,
    layout
}: AssetCardProps) {
    // Simple URL construction
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const modelUrl = modelPath && !modelPath.startsWith('http') ?
        `${baseUrl}/storage/v1/object/public/product-models/${modelPath}` : modelPath;

    const handleClick = () => {
        if (!modelPath?.includes('default-assets/')) {
            onClick(imagePath || null, modelUrl || null);
        }
    };

    const handleGenerateMore = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = `/studio?prompt=${encodeURIComponent(description || '')}&image=${encodeURIComponent(imagePath || '')}`;
    };

    const PreviewContent = (
        <div className="w-full h-full relative">
            {modelPath ? (
                <ModelPreview
                    modelUrl={modelPath}
                    imageUrl={imagePath}
                    small
                    bucket={modelPath.startsWith('default-assets/') ? 'default-assets' : 'product-models'}
                    canvasId={`asset-preview-${id}`}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-accent/10">
                    <Package className="w-8 h-8 text-muted-foreground" />
                </div>
            )}
        </div>
    );

    const GenerateMoreButton = (
        <div
            className="w-24 h-24 border border-dashed border-border flex items-center justify-center hover:border-primary hover:bg-accent/50 transition-colors duration-200 cursor-pointer"
            onClick={handleGenerateMore}
        >
            <Plus className="w-8 h-8 text-muted-foreground hover:text-primary transition-colors duration-200" />
        </div>
    );

    if (layout === 'stack') {
        return (
            <div className="flex flex-col gap-2 group border border-border bg-card/50 p-2 hover:bg-accent/50">
                <div className="w-full">
                    <h3 className="text-sm font-medium truncate">{title}</h3>
                    {description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {description}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <div
                        className={cn(
                            "w-24 h-24 bg-card/50 border border-border flex-shrink-0 cursor-pointer",
                            "group-hover:border-primary/50 transition-colors duration-200"
                        )}
                        onClick={handleClick}
                    >
                        {PreviewContent}
                    </div>
                    {GenerateMoreButton}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 group">
            <div className="space-y-1">
                <h3 className="text-sm font-medium truncate">{title}</h3>
                {description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                        {description}
                    </p>
                )}
            </div>
            <div className="flex gap-2">
                <div
                    className={cn(
                        "aspect-square w-full bg-card/50 border border-border cursor-pointer",
                        "group-hover:border-primary/50 transition-colors duration-200"
                    )}
                    onClick={handleClick}
                >
                    {PreviewContent}
                </div>
                {GenerateMoreButton}
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.id === nextProps.id &&
        prevProps.modelPath === nextProps.modelPath &&
        prevProps.imagePath === nextProps.imagePath &&
        prevProps.layout === nextProps.layout
    );
}); 