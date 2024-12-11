'use client';

import { useEffect, useRef } from 'react';
import { Heart, Download, Eye } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CommunityProduct } from '@/types/community';
import { supabase } from '@/lib/supabase/supabase';

// Helper function to format numbers
const formatCount = (count: number): string => {
    if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
};

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
    const lastViewRef = useRef<Date | null>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            async (entries) => {
                entries.forEach(async (entry) => {
                    if (entry.isIntersecting) {
                        const now = new Date();
                        const shouldCount = !lastViewRef.current ||
                            (now.getTime() - lastViewRef.current.getTime()) > 5 * 60 * 1000;

                        if (shouldCount) {
                            lastViewRef.current = now;
                            const { error } = await supabase.rpc('record_product_view', {
                                p_product_id: product.id,
                                p_view_type: 'scroll'
                            });

                            if (error) {
                                console.error('Error recording view:', error);
                            }
                        }
                    }
                });
            },
            { threshold: 0.5 }
        );

        if (itemRef.current) {
            observer.observe(itemRef.current);
        }

        // Record page load view
        const recordInitialView = async () => {
            const { error } = await supabase.rpc('record_product_view', {
                p_product_id: product.id,
                p_view_type: 'page_load'
            });

            if (error) {
                console.error('Error recording initial view:', error);
            }
        };

        recordInitialView();
        return () => observer.disconnect();
    }, [product.id]);

    const handleSelect = async () => {
        try {
            const { error } = await supabase.rpc('record_product_view', {
                p_product_id: product.id,
                p_view_type: 'click'
            });

            if (error) {
                console.error('Error recording view:', error);
            }
            onSelect(product);
        } catch (error) {
            console.error('Error recording view:', error);
            onSelect(product);
        }
    };

    return (
        <div ref={itemRef} className="group relative bg-card overflow-hidden border border-border hover:border-primary transition-all rounded-none">
            {/* Image Container */}
            <div
                className="aspect-[4/3] cursor-pointer overflow-hidden"
                onClick={handleSelect}
            >
                <img
                    src={product.image_path}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
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
                            className={`flex items-center gap-1.5 rounded-none ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
                            onClick={() => onLike(product.id)}
                        >
                            <Heart
                                className={`h-4 w-4 ${isLiked ? 'fill-red-500' : ''}`}
                            />
                            <span className="text-xs">{formatCount(product.likes_count)}</span>
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
                            onClick={() => onDownload(product.id)}
                        >
                            <Download className="h-4 w-4" />
                            <span className="text-xs">{formatCount(product.downloads_count)}</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
} 