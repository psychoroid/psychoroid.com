'use client';

import { useState } from 'react';
import { Search, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from 'date-fns';
import { toast } from "sonner"
import { supabase } from '@/lib/supabase/supabase'
import Loader from '@/components/design/loader';

interface UserAsset {
    id: string;
    name: string;
    description: string;
    image_path: string;
    model_path: string;
    visibility: 'public' | 'private' | 'unlisted';
    likes_count: number;
    downloads_count: number;
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
}

const handleVisibilityToggle = async (asset: UserAsset, onSearch: (query: string) => void, searchQuery: string) => {
    try {
        const newVisibility = asset.visibility === 'public' ? 'private' : 'public'
        const { data, error } = await supabase.rpc('toggle_model_visibility', {
            p_product_id: asset.id,
            p_visibility: newVisibility
        })

        if (error) throw error

        toast.success(`Model is now ${newVisibility}`)
        // Refresh assets list
        onSearch(searchQuery)
    } catch (error) {
        console.error('Error toggling visibility:', error)
        toast.error('Failed to update visibility')
    }
}

const ITEMS_PER_PAGE = 10

export function UserAssetsList({
    assets,
    onSearch,
    onPageChange,
    currentPage,
    totalPages,
    isLoading = false
}: UserAssetsListProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        onSearch(query);
    };

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search assets..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-9 h-8 text-xs rounded-none border-border"
                />
            </div>

            {/* Assets List */}
            <div
                className="space-y-4 h-[calc(100vh-16rem)] overflow-y-auto scrollbar-hide"
            >
                {isLoading ? (
                    <div className="text-center py-12">
                        <Loader />
                    </div>
                ) : assets.length === 0 ? (
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
                        {assets.map((asset) => (
                            <div
                                key={asset.id}
                                className="flex flex-col sm:flex-row gap-4 p-3 border border-border rounded-none hover:bg-accent/50 transition-colors min-h-[160px] sm:min-h-0 sm:h-24"
                            >
                                {/* Image */}
                                <div className="w-full h-32 sm:w-24 sm:h-18 flex-shrink-0">
                                    <img
                                        src={asset.image_path}
                                        alt={asset.name}
                                        className="w-full h-full object-cover rounded-none"
                                    />
                                </div>

                                {/* Content */}
                                <div className="flex-grow space-y-2 sm:space-y-1">
                                    <div className="flex items-start justify-between">
                                        <h3 className="font-medium text-foreground text-sm truncate pr-2">
                                            {asset.name}
                                        </h3>
                                        <Badge
                                            variant={asset.visibility === 'public' ? 'default' : 'secondary'}
                                            className="cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                                            onClick={() => handleVisibilityToggle(asset, onSearch, searchQuery)}
                                        >
                                            {asset.visibility}
                                        </Badge>
                                    </div>

                                    <p className="text-xs text-muted-foreground line-clamp-2 sm:line-clamp-1">
                                        {asset.description}
                                    </p>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-1">
                                        {asset.tags?.map((tag, index) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>

                                    {/* Stats */}
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                        <span>{asset.likes_count} likes</span>
                                        <span>{asset.downloads_count} downloads</span>
                                        <span className="truncate">
                                            Created {formatDistanceToNow(new Date(asset.created_at), {
                                                addSuffix: true,
                                                includeSeconds: true
                                            }).replace('about ', '')}
                                        </span>
                                    </div>
                                </div>
                            </div>
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
} 