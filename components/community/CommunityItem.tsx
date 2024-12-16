'use client';

import { useEffect, useState } from 'react';
import { Heart, Download, Share2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CommunityProduct } from '@/types/community';
import { supabase } from '@/lib/supabase/supabase';
import { ModelPreview } from '@/components/community/CommunityModelPreview';
import Image from 'next/image';
import { DownloadModal } from './DownloadModal';
import { formatCount } from '@/lib/utils/products';
import { getTagColor } from '@/lib/utils/tagColors';
import { ShareModal } from './ShareModal';
import { AuthModal } from '@/components/auth/AuthModal';
import { useUser } from '@/lib/contexts/UserContext';

interface CommunityItemProps {
    product: CommunityProduct;
    onSelect: (product: CommunityProduct) => void;
    onLike: (id: string) => void;
    onDownload: (id: string) => void;
    isLiked: boolean;
}

export function CommunityItem({
    product,
    onSelect,
    onLike,
    onDownload,
    isLiked
}: CommunityItemProps) {
    const [likeCount, setLikeCount] = useState(product.likes_count || 0);
    const [isLikedState, setIsLikedState] = useState(isLiked);
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const { user } = useUser();

    // Update local state when props change
    useEffect(() => {
        setIsLikedState(isLiked);
        setLikeCount(product.likes_count || 0);
    }, [isLiked, product.likes_count]);

    // Record initial view on mount
    useEffect(() => {
        const recordInitialView = async () => {
            try {
                const { data, error } = await supabase.rpc('record_product_view', {
                    p_product_id: product.id,
                    p_view_type: 'page_load'
                });

                if (error) {
                    console.error('Error recording view:', error.message);
                }
            } catch (error) {
                console.error('Error recording view:', error);
            }
        };

        recordInitialView();
    }, [product.id]);

    const handleSelect = async () => {
        try {
            const { data, error } = await supabase.rpc('record_product_view', {
                p_product_id: product.id,
                p_view_type: 'click'
            });

            if (error) {
                console.error('Error recording view:', error.message);
            }

            onSelect(product);
        } catch (error) {
            console.error('Error recording view:', error);
            onSelect(product);
        }
    };

    const handleLikeClick = async () => {
        if (!user) {
            setShowAuthModal(true);
            return;
        }

        // Optimistic update
        setIsLikedState(prev => !prev);
        setLikeCount(prev => prev + (isLikedState ? -1 : 1));

        try {
            await onLike(product.id);
        } catch (error) {
            // Revert on error
            setIsLikedState(prev => !prev);
            setLikeCount(prev => prev + (isLikedState ? 1 : -1));
            console.error('Error toggling like:', error);
        }
    };

    const handleDownloadClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!user) {
            setShowAuthModal(true);
            return;
        }
        setShowDownloadModal(true);
    };

    return (
        <>
            <div className="group relative bg-card overflow-hidden border border-border hover:border-primary transition-all rounded-none">
                {/* Image Container */}
                <div
                    className="aspect-[4/3] cursor-pointer overflow-hidden bg-transparent"
                    onClick={handleSelect}
                >
                    {product.model_path ? (
                        <div className="w-full h-full bg-transparent">
                            <ModelPreview
                                modelUrl={product.model_path}
                                imageUrl={product.image_path}
                                bucket={product.tags?.includes('starter') ? 'default-assets' : 'product-models'}
                                canvasId={`preview-canvas-${product.id}`}
                            />
                        </div>
                    ) : (
                        <Image
                            src={product.image_path}
                            alt={product.name}
                            width={500}
                            height={300}
                            className="w-full h-auto object-cover"
                        />
                    )}
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Title - Made clickable */}
                    <h3
                        className="font-medium text-foreground line-clamp-1 cursor-pointer hover:text-primary transition-colors"
                        onClick={handleSelect}
                    >
                        {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        @{product.username}
                    </p>

                    {/* Tags */}
                    {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 translate-y-[3px]">
                            {product.tags.slice(0, 3).map((tag, index) => (
                                <Badge
                                    key={index}
                                    variant="outline"
                                    className={`text-xs rounded-none ${getTagColor(tag)} hover:bg-accent/50`}
                                >
                                    {tag}
                                </Badge>
                            ))}
                            {product.tags.length > 3 && (
                                <Badge
                                    variant="outline"
                                    className="text-xs rounded-none bg-primary/10 text-primary border-primary/20"
                                >
                                    +{product.tags.length - 3}
                                </Badge>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-4 border-t pt-4 border-border">
                        <div className="flex items-center justify-between w-full px-0.5">
                            {/* Likes */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`flex items-center gap-1.5 rounded-none ${isLikedState ? 'text-red-500' : 'hover:text-red-500'}`}
                                onClick={handleLikeClick}
                            >
                                <Heart
                                    className={`h-4 w-4 ${isLikedState ? 'fill-red-500' : ''}`}
                                />
                                <span className="text-xs">{formatCount(likeCount)}</span>
                            </Button>

                            {/* Downloads - Moved before Share */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1.5 rounded-none"
                                onClick={handleDownloadClick}
                            >
                                <Download className="h-4 w-4" />
                                <span className="text-xs">{formatCount(product.downloads_count)}</span>
                            </Button>

                            {/* Share - Moved after Downloads */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1.5 rounded-none hover:text-primary"
                                onClick={() => setShowShareModal(true)}
                            >
                                <Share2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />

            <DownloadModal
                isOpen={showDownloadModal}
                onClose={() => setShowDownloadModal(false)}
                product={product}
                onDownload={onDownload}
            />

            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                product={product}
            />
        </>
    );
} 