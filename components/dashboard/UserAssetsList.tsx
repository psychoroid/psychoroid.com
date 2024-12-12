'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from 'date-fns';
import { toast } from "sonner"
import { supabase } from '@/lib/supabase/supabase'
import { ModelPreview } from '@/components/3D/ModelPreview';
import Image from 'next/image';
import { memo } from 'react';
import debounce from 'lodash/debounce';
import { Skeleton } from "@/components/ui/skeleton"

interface UserAsset {
    id: string;
    name: string;
    description: string;
    image_path: string;
    model_path: string;
    visibility: 'public' | 'private' | 'unlisted';
    likes_count: number;
    downloads_count: number;
    views_count: number;
    tags: string[];
    created_at: string;
    updated_at: string;
}

interface UserAssetsListProps {
    assets: UserAsset[];
    onSearch: (query: string) => void;
    onPageChange: (page: number) => void;
    currentPage: number;
    totalPages: number;
    isLoading?: boolean;
    onAssetUpdate?: () => void;
}

const ITEMS_PER_PAGE = 15

// Create a separate memoized asset card component
const AssetCard = memo(({ asset, index, onVisibilityToggle }: {
    asset: UserAsset;
    index: number;
    onVisibilityToggle: (asset: UserAsset, index: number) => Promise<void>;
}) => {
    const [showModel, setShowModel] = useState(false)
    const [imageError, setImageError] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => {
            if (index < 5) {
                setShowModel(true)
            }
        }, index < 5 ? 0 : index * 200)

        return () => clearTimeout(timer)
    }, [index])

    const renderPreview = () => {
        if (asset.model_path && showModel) {
            return (
                <div className="w-full h-full relative">
                    <ModelPreview
                        modelUrl={asset.model_path}
                        imageUrl={asset.image_path}
                        small
                    />
                </div>
            )
        }

        if (!asset.image_path || imageError) {
            return (
                <div className="w-full h-full bg-accent/10 flex items-center justify-center">
                    <Package className="w-12 h-12 text-muted-foreground" />
                </div>
            )
        }

        return (
            <div className="w-full h-full bg-accent/10 flex items-center justify-center">
                <div className="relative w-24 h-24">
                    <Image
                        src={asset.image_path}
                        alt={asset.name || 'Asset preview'}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                        onError={() => setImageError(true)}
                        priority={index < 5}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col sm:flex-row gap-4 p-3 border border-border rounded-none hover:bg-accent/50 transition-colors min-h-[160px] sm:min-h-0 sm:h-[120px] group">
            <div className="w-full h-32 sm:w-24 sm:h-24 flex-shrink-0 overflow-hidden">
                {renderPreview()}
            </div>

            {/* Content */}
            <div className="flex-grow space-y-2 sm:space-y-1">
                <div className="flex items-start justify-between">
                    <h3 className="font-medium text-foreground text-sm truncate pr-2">
                        {asset.name}
                    </h3>
                    <Badge
                        variant={asset.visibility === 'public' ? 'default' : 'secondary'}
                        className={`cursor-pointer hover:opacity-80 transition-opacity shrink-0 rounded-none ${asset.visibility === 'public'
                            ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                            : 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20'
                            }`}
                        onClick={() => onVisibilityToggle(asset, index)}
                    >
                        {asset.visibility.charAt(0).toUpperCase() + asset.visibility.slice(1)}
                    </Badge>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 sm:line-clamp-1">
                    {asset.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                    {asset.tags?.slice(0, 4).map((tag, index) => (
                        <Badge
                            key={index}
                            variant="outline"
                            className={`text-xs rounded-none ${tag === 'starter'
                                ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                                } hover:bg-accent/50`}
                        >
                            {tag}
                        </Badge>
                    ))}
                    {asset.tags && asset.tags.length > 4 && (
                        <div className="relative group">
                            <Badge
                                variant="outline"
                                className="text-xs rounded-none bg-primary/10 text-primary border-primary/20 hover:bg-accent/50"
                            >
                                +{asset.tags.length - 4}
                            </Badge>
                            {/* Hover popup */}
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10">
                                <div className="bg-popover border border-border shadow-lg rounded-none p-2 min-w-[120px]">
                                    <div className="flex flex-wrap gap-1">
                                        {asset.tags.slice(4).map((tag, index) => (
                                            <Badge
                                                key={index}
                                                variant="outline"
                                                className={`text-xs rounded-none ${tag === 'starter'
                                                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                    : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                                                    } hover:bg-accent/50`}
                                            >
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{asset.likes_count} likes</span>
                    <span>{asset.downloads_count} downloads</span>
                    <span>{asset.views_count || 0} views</span>
                    <span className="truncate">
                        Created {formatDistanceToNow(new Date(asset.created_at), {
                            addSuffix: true,
                            includeSeconds: true
                        }).replace('about ', '')}
                    </span>
                </div>
            </div>
        </div>
    );
});

AssetCard.displayName = 'AssetCard';

export const UserAssetsList = memo(function UserAssetsList({
    assets,
    onSearch,
    onPageChange,
    currentPage,
    totalPages,
    isLoading = false,
    onAssetUpdate
}: UserAssetsListProps) {
    const [searchQuery, setSearchQuery] = useState('');

    // Debounce search handler
    const handleSearch = useMemo(
        () => debounce((query: string) => {
            setSearchQuery(query);
            onSearch(query);
        }, 300),
        [onSearch]
    );

    const handleVisibilityToggle = useCallback(async (asset: UserAsset, index: number) => {
        try {
            const newVisibility = asset.visibility === 'public' ? 'private' : 'public';

            const { data, error } = await supabase.rpc('toggle_model_visibility', {
                p_product_id: asset.id,
                p_visibility: newVisibility
            });

            if (error) throw error;
            if (data === false) throw new Error('Not authorized to update this model');

            toast.success(`Model is now ${newVisibility}`);

            if (onAssetUpdate) {
                onAssetUpdate();
            }
        } catch (error: any) {
            console.error('Error toggling visibility:', error);
            toast.error(error.message || 'Failed to update visibility');
        }
    }, [onAssetUpdate]);

    if (isLoading && assets.length === 0) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="flex gap-4 p-3 border border-border rounded-none h-[120px]"
                    >
                        <Skeleton className="w-24 h-24 flex-shrink-0" />
                        <div className="flex-1 space-y-3">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                            <Skeleton className="h-3 w-1/4" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search assets..."
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-9 h-8 text-xs rounded-none border-border"
                />
            </div>

            {/* Assets List */}
            <div className="space-y-4 h-[calc(100vh-16rem)] overflow-y-auto scrollbar-hide">
                {assets.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-border rounded-lg">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">No assets found</h3>
                        <p className="text-sm text-muted-foreground">
                            {searchQuery
                                ? "Try adjusting your search terms"
                                : "Start by creating your first 3D model then visit this page to see your history"}
                        </p>
                    </div>
                ) : (
                    <>
                        {assets.map((asset, index) => (
                            <AssetCard
                                key={asset.id}
                                asset={asset}
                                index={index}
                                onVisibilityToggle={handleVisibilityToggle}
                            />
                        ))}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 pt-4 mt-auto sticky bottom-0 bg-background">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 rounded-none"
                                    onClick={() => onPageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                    {currentPage} / {totalPages}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 rounded-none"
                                    onClick={() => onPageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}); 