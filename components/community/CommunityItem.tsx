'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Heart, Download, Eye } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CommunityProduct } from '@/types/community';
import { supabase } from '@/lib/supabase/supabase';
import { ModelPreview } from '@/components/3D/ModelPreview';
import Image from 'next/image';
import { saveAs } from 'file-saver';
import { DownloadModal } from './DownloadModal';
import { formatCount } from '@/lib/utils/products';

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
    const itemRef = useRef<HTMLDivElement>(null);
    const [likeCount, setLikeCount] = useState(product.likes_count || 0);
    const [isLikedState, setIsLikedState] = useState(isLiked);
    const viewTimeoutRef = useRef<NodeJS.Timeout>();
    const lastViewRef = useRef<number>(Date.now());
    const [showDownloadModal, setShowDownloadModal] = useState(false);

    // Update local state when props change
    useEffect(() => {
        setIsLikedState(isLiked);
        setLikeCount(product.likes_count || 0);
    }, [isLiked, product.likes_count]);

    // Handle view counting with debouncing
    const handleView = useCallback(async () => {
        const now = Date.now();
        if (now - lastViewRef.current >= 5 * 60 * 1000) {
            try {
                await supabase.rpc('record_product_view', {
                    p_product_id: product.id,
                    p_view_type: 'scroll'
                });
            } catch (error) {
                console.error('Error recording view:', error);
            }
        }
    }, [product.id]);

    // Intersection Observer setup
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        // Clear any existing timeout
                        if (viewTimeoutRef.current) {
                            clearTimeout(viewTimeoutRef.current);
                        }
                        // Set a new timeout to record the view after 2 seconds of visibility
                        viewTimeoutRef.current = setTimeout(() => {
                            handleView();
                        }, 2000);
                    } else {
                        // Clear timeout if element is no longer visible
                        if (viewTimeoutRef.current) {
                            clearTimeout(viewTimeoutRef.current);
                        }
                    }
                });
            },
            { threshold: 0.5 }
        );

        if (itemRef.current) {
            observer.observe(itemRef.current);
        }

        return () => {
            if (viewTimeoutRef.current) {
                clearTimeout(viewTimeoutRef.current);
            }
            observer.disconnect();
        };
    }, [handleView]);

    // Record initial view on mount
    useEffect(() => {
        const recordInitialView = async () => {
            const { error } = await supabase.rpc('record_product_view', {
                p_product_id: product.id,
                p_view_type: 'page_load'
            });

            if (!error) {
                setLikeCount(prev => prev + 1);
            }
        };

        recordInitialView();
    }, [product.id]);

    const handleSelect = async () => {
        try {
            const { error } = await supabase.rpc('record_product_view', {
                p_product_id: product.id,
                p_view_type: 'click'
            });

            if (!error) {
                setLikeCount(prev => prev + 1);
            }
            onSelect(product);
        } catch (error) {
            console.error('Error recording view:', error);
            onSelect(product);
        }
    };

    const handleLikeClick = async () => {
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

    return (
        <>
            <div ref={itemRef} className="group relative bg-card overflow-hidden border border-border hover:border-primary transition-all rounded-none">
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
                                bucket={product.tags?.includes('template') ? 'default-assets' : 'product-models'}
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
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {product.description}
                    </p>

                    {/* Tags */}
                    {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {product.tags.slice(0, 3).map((tag, index) => (
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

                            {/* Views */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1.5 rounded-none text-muted-foreground"
                            >
                                <Eye className="h-4 w-4" />
                                <span className="text-xs">{formatCount(product.views_count || 0)}</span>
                            </Button>

                            {/* Downloads */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1.5 rounded-none"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setShowDownloadModal(true);
                                }}
                            >
                                <Download className="h-4 w-4" />
                                <span className="text-xs">{formatCount(product.downloads_count)}</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <DownloadModal
                isOpen={showDownloadModal}
                onClose={() => setShowDownloadModal(false)}
                product={product}
                onDownload={onDownload}
            />
        </>
    );
} 