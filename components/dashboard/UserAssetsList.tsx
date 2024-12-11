'use client';

import { useState } from 'react';
import { Search, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from 'date-fns';

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
                    className="w-full pl-9 h-9 text-xs rounded-none"
                />
            </div>

            {/* Assets List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                        <p className="text-sm text-muted-foreground mt-4">Loading assets...</p>
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
                                className="flex gap-4 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                            >
                                {/* Image */}
                                <div className="w-32 h-32 flex-shrink-0">
                                    <img
                                        src={asset.image_path}
                                        alt={asset.name}
                                        className="w-full h-full object-cover rounded-md"
                                    />
                                </div>

                                {/* Content */}
                                <div className="flex-grow space-y-2">
                                    <div className="flex items-start justify-between">
                                        <h3 className="font-medium text-foreground">{asset.name}</h3>
                                        <Badge variant={asset.visibility === 'public' ? 'default' : 'secondary'}>
                                            {asset.visibility}
                                        </Badge>
                                    </div>

                                    <p className="text-sm text-muted-foreground line-clamp-2">
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
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span>{asset.likes_count} likes</span>
                                        <span>{asset.downloads_count} downloads</span>
                                        <span>Created {formatDistanceToNow(new Date(asset.created_at))} ago</span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-8">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => onPageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="icon"
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