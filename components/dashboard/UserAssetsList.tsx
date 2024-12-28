'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, Package, ChevronLeft, ChevronRight, Eye, Heart, Download, Plus } from 'lucide-react';
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

const ITEMS_PER_PAGE = 25

// Create a separate memoized asset card component
const AssetCard = memo(({ asset, index, onVisibilityToggle, currentLanguage, onSelect, onEditStart, onEditEnd }: {
    asset: UserAsset;
    index: number;
    onVisibilityToggle: (asset: UserAsset, index: number) => Promise<void>;
    currentLanguage: string;
    onSelect: () => void;
    onEditStart: () => void;
    onEditEnd: () => void;
}) => {
    const [imageError, setImageError] = useState(false)
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [editingTag, setEditingTag] = useState<number | null>(null);
    const [showTagInput, setShowTagInput] = useState(false);
    const [newTagInput, setNewTagInput] = useState('');
    const [localAsset, setLocalAsset] = useState(asset);

    const inputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLInputElement>(null);

    const handleDownload = () => {
        // Just show the download modal, it will handle the download recording
        setShowDownloadModal(true);
    };

    const renderPreview = () => {
        console.log(`[Debug] Rendering preview for asset: ${asset.name}`, {
            hasModelPath: !!asset.model_path,
            modelPath: asset.model_path,
            imageError: imageError
        });

        if (asset.model_path) {
            try {
                console.log(`[Debug] Attempting to render 3D model for: ${asset.name}`);
                const isDefaultModel = asset.model_path.startsWith('default-assets/');
                return (
                    <div className="w-full h-full relative">
                        <ModelPreview
                            modelUrl={asset.model_path}
                            imageUrl={`product-images/${asset.image_path}`}
                            small
                            bucket={isDefaultModel ? 'default-assets' : 'product-models'}
                            onError={(error: Error) => {
                                console.error(`[Debug] ModelPreview error for ${asset.name}:`, error);
                                setImageError(true);
                            }}
                        />
                    </div>
                )
            } catch (error) {
                console.error(`[Debug] Error in renderPreview for ${asset.name}:`, error);
                return (
                    <div className="w-full h-full bg-accent/10 flex items-center justify-center">
                        <div className="relative w-24 h-24">
                            <Image
                                src={`https://peyzpnmmgsxjydvpussg.supabase.co/storage/v1/object/public/product-images/${asset.image_path}`}
                                alt={asset.name || 'Asset preview'}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover"
                                onError={() => {
                                    console.log(`[Debug] Image error fallback for ${asset.name}`);
                                    setImageError(true);
                                }}
                                priority={index < 5}
                            />
                        </div>
                    </div>
                )
            }
        }

        console.log(`[Debug] Falling back to image for ${asset.name}`, {
            reason: !asset.model_path ? 'No model path' : 'Unknown'
        });

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

    const handleNameSubmit = useCallback(async () => {
        if (!localAsset.name.trim()) return;
        setIsEditingName(false);

        try {
            const { error } = await supabase.rpc('update_product_name', {
                p_product_id: localAsset.id,
                p_name: localAsset.name.trim()
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error updating name:', error);
        }
    }, [localAsset]);

    const handleDescriptionSubmit = useCallback(async () => {
        setIsEditingDescription(false);

        try {
            const { error } = await supabase.rpc('update_product_description', {
                p_product_id: localAsset.id,
                p_description: localAsset.description?.trim() || ''
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error updating description:', error);
        }
    }, [localAsset]);

    const handleTagEdit = useCallback(async (index: number, tag: string) => {
        if (!tag.trim()) return;

        const newTags = [...localAsset.tags];
        newTags[index] = tag.trim();
        setLocalAsset(prev => ({ ...prev, tags: newTags }));
        setEditingTag(null);

        try {
            const { error } = await supabase.rpc('update_product_tags', {
                p_product_id: localAsset.id,
                p_tags: newTags
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error updating tags:', error);
            // Silently fail and keep UI state
        }
    }, [localAsset]);

    const handleAddTag = useCallback(async () => {
        if (!newTagInput.trim()) {
            setShowTagInput(false);
            setNewTagInput('');
            return;
        }

        const newTags = [...localAsset.tags, newTagInput.trim()];
        setLocalAsset(prev => ({ ...prev, tags: newTags }));
        setNewTagInput('');
        setShowTagInput(false);

        try {
            const { error } = await supabase.rpc('update_product_tags', {
                p_product_id: localAsset.id,
                p_tags: newTags
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error adding tag:', error);
        }
    }, [newTagInput, localAsset]);

    const handleRemoveTag = useCallback(async (indexToRemove: number) => {
        const newTags = localAsset.tags.filter((_, i) => i !== indexToRemove);
        setLocalAsset(prev => ({ ...prev, tags: newTags }));

        try {
            const { error } = await supabase.rpc('update_product_tags', {
                p_product_id: localAsset.id,
                p_tags: newTags
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error removing tag:', error);
            // Silently fail and keep UI state
        }
    }, [localAsset]);

    const startEditing = useCallback(() => {
        setIsEditingName(true);
    }, []);

    const startDescriptionEditing = useCallback(() => {
        setIsEditingDescription(true);
    }, []);

    const startTagEditing = useCallback((index: number) => {
        onEditStart();
        setEditingTag(index);
    }, [onEditStart]);

    return (
        <>
            <div className="flex flex-col sm:flex-row gap-4 p-3 border border-border rounded-none hover:bg-accent/50 transition-colors min-h-[160px] sm:min-h-0 sm:h-[120px] group">
                <div className="w-full h-32 sm:w-24 sm:h-24 flex-shrink-0 overflow-hidden">
                    {renderPreview()}
                </div>

                {/* Content */}
                <div className="flex-grow space-y-2 sm:space-y-1">
                    <div className="flex items-start justify-between">
                        {isEditingName ? (
                            <Input
                                ref={inputRef}
                                value={localAsset.name}
                                onChange={(e) => setLocalAsset(prev => ({ ...prev, name: e.target.value }))}
                                onBlur={handleNameSubmit}
                                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                                className="h-6 min-w-0 w-auto max-w-[200px] text-sm font-medium rounded-none px-1 py-0 border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                                autoFocus
                            />
                        ) : (
                            <h3
                                className="font-medium text-foreground text-sm truncate pr-2 cursor-pointer hover:text-accent"
                                onClick={startEditing}
                            >
                                {localAsset.name}
                            </h3>
                        )}
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

                    {isEditingDescription ? (
                        <Input
                            ref={textareaRef as any}
                            value={localAsset.description || ''}
                            onChange={(e) => setLocalAsset(prev => ({ ...prev, description: e.target.value }))}
                            onBlur={handleDescriptionSubmit}
                            onKeyDown={(e) => e.key === 'Enter' && handleDescriptionSubmit()}
                            className="h-5 min-w-0 w-full text-xs rounded-none px-1 py-0 border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                            autoFocus
                        />
                    ) : (
                        <p
                            className="text-xs text-muted-foreground line-clamp-2 sm:line-clamp-1 cursor-pointer hover:text-accent"
                            onClick={startDescriptionEditing}
                        >
                            {localAsset.description}
                        </p>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 translate-y-[3px]">
                        {localAsset.tags?.map((tag, index) => (
                            editingTag === index ? (
                                <Input
                                    key={index}
                                    value={tag}
                                    onChange={(e) => {
                                        const newTags = [...localAsset.tags];
                                        newTags[index] = e.target.value;
                                        setLocalAsset(prev => ({ ...prev, tags: newTags }));
                                    }}
                                    onBlur={() => handleTagEdit(index, tag)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleTagEdit(index, tag);
                                        if (e.key === 'Escape') setEditingTag(null);
                                        if (e.key === 'Backspace' && !tag) handleRemoveTag(index);
                                    }}
                                    className="h-[22px] min-w-0 w-20 text-xs rounded-none px-1 py-0 border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-accent/30"
                                    autoFocus
                                />
                            ) : (
                                <Badge
                                    key={index}
                                    variant="outline"
                                    className={`text-xs rounded-none ${getTagColor(tag)} hover:bg-accent/50 cursor-pointer h-[22px] flex items-center px-2 group`}
                                    onClick={() => startTagEditing(index)}
                                >
                                    {tag}
                                </Badge>
                            )
                        ))}
                        {showTagInput ? (
                            <Input
                                value={newTagInput}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setNewTagInput(value);
                                    if (!value.trim()) {
                                        setShowTagInput(false);
                                        setNewTagInput('');
                                    }
                                }}
                                onBlur={() => {
                                    setTimeout(() => {
                                        setShowTagInput(false);
                                        setNewTagInput('');
                                    }, 100);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newTagInput.trim()) {
                                        handleAddTag();
                                    }
                                    if (e.key === 'Escape') {
                                        setShowTagInput(false);
                                        setNewTagInput('');
                                    }
                                }}
                                className="h-[22px] min-w-0 w-16 text-xs rounded-none px-1 py-0 border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-accent/30"
                                autoFocus
                            />
                        ) : (
                            <Badge
                                variant="outline"
                                className="text-xs cursor-pointer hover:bg-accent/50 rounded-none h-[22px] w-[22px] flex items-center justify-center relative group"
                                onClick={() => {
                                    setShowTagInput(true);
                                    setNewTagInput('');
                                }}
                            >
                                <div className="absolute inset-0 flex items-center justify-center bg-accent/0 group-hover:bg-accent/30 transition-colors">
                                    <Plus className="h-3 w-3 text-white" />
                                </div>
                            </Badge>
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

    // Add editing state to prevent refreshes while editing
    const [isEditing, setIsEditing] = useState(false);

    // Modify the refresh effect to respect editing state
    useEffect(() => {
        if (document.visibilityState === 'visible' && onAssetUpdate && !isEditing) {
            const interval = setInterval(onAssetUpdate, 30000);
            return () => clearInterval(interval);
        }
    }, [onAssetUpdate, isEditing]);

    // Modify AssetCard to handle editing state
    const handleEditStart = useCallback(() => {
        setIsEditing(true);
    }, []);

    const handleEditEnd = useCallback(() => {
        setIsEditing(false);
        // Optional: Trigger a single refresh after editing
        if (onAssetUpdate) {
            setTimeout(onAssetUpdate, 500);
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
                                onEditStart={handleEditStart}
                                onEditEnd={handleEditEnd}
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
                                    className="h-6 w-6"
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
                                    className="h-6 w-6"
                                    onClick={() => onPageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
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