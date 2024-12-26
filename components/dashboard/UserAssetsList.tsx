'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Package, ChevronLeft, ChevronRight, Eye, Heart, Download } from 'lucide-react';
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
import { usePathname } from 'next/navigation'
import { formatCount } from '@/lib/utils/products';
import { getTagColor } from '@/lib/utils/tagColors';
import { useTranslation } from '@/lib/contexts/TranslationContext'
import { t } from '@/lib/i18n/translations'
import Loader from '@/components/design/loader';
import { cn } from "@/lib/actions/utils"
import { DownloadModal } from '@/components/community/DownloadModal';
import type { CommunityProduct } from '@/types/community';

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
    error?: string | null;
}

const ITEMS_PER_PAGE = 15

// Create a separate memoized asset card component
const AssetCard = memo(({ asset, index, onVisibilityToggle, currentLanguage, onSelect }: {
    asset: UserAsset;
    index: number;
    onVisibilityToggle: (asset: UserAsset, index: number) => Promise<void>;
    currentLanguage: string;
    onSelect: () => void;
}) => {
    const [showModel, setShowModel] = useState(false)
    const [imageError, setImageError] = useState(false)
    const [showDownloadModal, setShowDownloadModal] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (index < 5) {
                setShowModel(true)
            }
        }, index < 5 ? 0 : index * 200)

        return () => clearTimeout(timer)
    }, [index])

    const handleDownload = () => {
        // Just show the download modal, it will handle the download recording
        setShowDownloadModal(true);
    };

    const renderPreview = () => {
        if (asset.model_path && showModel) {
            try {
                const isDefaultModel = asset.model_path.startsWith('default-assets/');
                return (
                    <div className="w-full h-full relative">
                        <ModelPreview
                            modelUrl={asset.model_path}
                            imageUrl={`product-images/${asset.image_path}`}
                            small
                            bucket={isDefaultModel ? 'default-assets' : 'product-models'}
                        />
                    </div>
                )
            } catch (error) {
                console.error('Error loading model:', error);
                return (
                    <div className="w-full h-full bg-accent/10 flex items-center justify-center">
                        <div className="relative w-24 h-24">
                            <Image
                                src={`https://peyzpnmmgsxjydvpussg.supabase.co/storage/v1/object/public/product-images/${asset.image_path}`}
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
                        src={`https://peyzpnmmgsxjydvpussg.supabase.co/storage/v1/object/public/product-images/${asset.image_path}`}
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
        <>
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
                            className={cn(
                                `cursor-pointer hover:opacity-80 transition-opacity shrink-0 rounded-none`,
                                asset.visibility === 'public'
                                    ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                    : 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20',
                                asset.model_path.startsWith('default-assets/') && 'cursor-not-allowed opacity-50 pointer-events-none'
                            )}
                            onClick={() => !asset.model_path.startsWith('default-assets/') && onVisibilityToggle(asset, index)}
                        >
                            {asset.model_path.startsWith('default-assets/')
                                ? t(currentLanguage, 'ui.assets.visibility.default')
                                : t(currentLanguage, `ui.assets.visibility.${asset.visibility}`)}
                        </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 sm:line-clamp-1">
                        {asset.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 translate-y-[3px]">
                        {asset.tags?.slice(0, 4).map((tag, index) => (
                            <Badge
                                key={index}
                                variant="outline"
                                className={`text-xs rounded-none ${getTagColor(tag)} hover:bg-accent/50`}
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
                                                    className={`text-xs rounded-none ${getTagColor(tag)} hover:bg-accent/50`}
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

                    {/* Stats and Time - Updated Layout */}
                    <div className="flex items-center justify-between mt-auto pt-1">
                        {/* Stats with Icons */}
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1.5 rounded-none text-muted-foreground hover:bg-accent/30 pointer-events-none"
                            >
                                <Heart className="h-4 w-4" />
                                <span className="text-xs">{formatCount(asset.likes_count)}</span>
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1.5 rounded-none text-muted-foreground hover:bg-accent/30"
                                onClick={handleDownload}
                            >
                                <Download className="h-4 w-4" />
                                <span className="text-xs">{formatCount(asset.downloads_count)}</span>
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1.5 rounded-none text-muted-foreground hover:bg-accent/30 pointer-events-none"
                            >
                                <Eye className="h-4 w-4" />
                                <span className="text-xs">{formatCount(asset.views_count)}</span>
                            </Button>
                        </div>

                        {/* Keep the time display */}
                        <span className="text-xs text-muted-foreground">
                            Created {formatDistanceToNow(new Date(asset.created_at))} ago
                        </span>
                    </div>
                </div>
            </div>

            <DownloadModal
                isOpen={showDownloadModal}
                onClose={() => setShowDownloadModal(false)}
                product={{
                    ...asset,
                    username: '',
                } as CommunityProduct}
                onDownload={(format) => {
                    // Simulate progress and close modal after download
                    const timer = setTimeout(() => {
                        setShowDownloadModal(false);
                    }, 1000); // Wait 1 second after download completes before closing
                    return () => clearTimeout(timer);
                }}
            />
        </>
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
    onAssetUpdate,
    error
}: UserAssetsListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const pathname = usePathname();
    const { currentLanguage } = useTranslation();

    const debouncedSearch = useMemo(
        () => debounce((query: string) => {
            onSearch(query);
        }, 500),
        [onSearch]
    );

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, [debouncedSearch]);

    // Reset state when pathname changes
    useEffect(() => {
        setSearchQuery('');
    }, [pathname]);

    // Force refresh of assets periodically when visible
    useEffect(() => {
        if (document.visibilityState === 'visible' && onAssetUpdate) {
            const interval = setInterval(onAssetUpdate, 30000); // Refresh every 30 seconds
            return () => clearInterval(interval);
        }
    }, [onAssetUpdate]);

    // Optimized visibility toggle
    const handleVisibilityToggle = useCallback(async (asset: UserAsset, index: number) => {
        try {
            // Check if this is a default asset
            const isDefaultAsset = asset.model_path.startsWith('default-assets/');
            if (isDefaultAsset) {
                toast.error(t(currentLanguage, 'ui.assets.visibility.toggle.defaultAsset'));
                return;
            }

            const newVisibility = asset.visibility === 'public' ? 'private' : 'public';

            // API call
            const { data, error } = await supabase.rpc('toggle_model_visibility', {
                p_product_id: asset.id,
                p_visibility: newVisibility
            });

            if (error) throw error;
            if (data === false) throw new Error(t(currentLanguage, 'ui.assets.visibility.toggle.unauthorized'));

            toast.success(t(currentLanguage, 'ui.assets.visibility.toggle.success').replace('{visibility}', newVisibility));

            // Background refresh
            if (onAssetUpdate) {
                onAssetUpdate();
            }
        } catch (error: any) {
            console.error('Error toggling visibility:', error);
            toast.error(error.message || t(currentLanguage, 'ui.assets.visibility.toggle.error'));

            // Refresh to get current state
            if (onAssetUpdate) {
                onAssetUpdate();
            }
        }
    }, [onAssetUpdate, currentLanguage]);

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder={t(currentLanguage, 'ui.assets.search')}
                    value={searchQuery}
                    onChange={(e) => {
                        const query = e.target.value;
                        setSearchQuery(query);
                        debouncedSearch(query);
                    }}
                    className="pl-9 rounded-none text-xs"
                />
            </div>

            {isLoading ? (
                <div className="relative min-h-[300px]">
                    <Loader />
                </div>
            ) : error ? (
                <div className="text-sm text-red-500 text-center py-8">
                    {error}
                </div>
            ) : assets.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                    {searchQuery ? t(currentLanguage, 'ui.assets.noSearchResults') : t(currentLanguage, 'ui.assets.noResults')}
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {assets.map((asset, index) => (
                            <AssetCard
                                key={asset.id}
                                asset={asset}
                                index={index}
                                onVisibilityToggle={handleVisibilityToggle}
                                currentLanguage={currentLanguage}
                                onSelect={() => { }}
                            />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4">
                            <div className="text-sm text-muted-foreground">
                                {ITEMS_PER_PAGE} {t(currentLanguage, 'ui.assets.perPage')}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onPageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="rounded-none"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm">
                                    {t(currentLanguage, 'ui.assets.page')} {currentPage} {t(currentLanguage, 'ui.assets.of')} {totalPages}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onPageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="rounded-none"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}); 