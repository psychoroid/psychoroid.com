'use client';

import React from 'react';
import { Heart, Download, Eye } from 'lucide-react';
import { Button } from "@/components/ui/button";
import type { CommunityProduct, CommunityGridProps } from '@/types/community';

export function CommunityGrid({
    products,
    onProductSelect,
    selectedProduct,
    onLike,
    onDownload,
    userLikes
}: CommunityGridProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
                <div
                    key={product.id}
                    className="group relative bg-card rounded-lg overflow-hidden border border-border hover:border-primary transition-all"
                >
                    <div
                        className="aspect-square cursor-pointer"
                        onClick={() => onProductSelect(product)}
                    >
                        <img
                            src={product.image_path}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                    </div>

                    <div className="p-4">
                        <h3 className="font-medium text-foreground line-clamp-1">{product.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {product.description}
                        </p>

                        {/* Tags */}
                        {product.tags && product.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {product.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="px-2 py-0.5 bg-accent text-accent-foreground rounded-full text-xs"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex items-center gap-1 hover:text-red-500"
                                    onClick={() => onLike(product.id)}
                                >
                                    <Heart
                                        className={`h-4 w-4 ${userLikes.has(product.id) ? 'fill-red-500 text-red-500' : ''
                                            }`}
                                    />
                                    <span className="text-xs">{product.likes_count}</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex items-center gap-1"
                                    onClick={() => onDownload(product.id)}
                                >
                                    <Download className="h-4 w-4" />
                                    <span className="text-xs">{product.downloads_count}</span>
                                </Button>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1"
                                onClick={() => onProductSelect(product)}
                            >
                                <Eye className="h-4 w-4" />
                                <span className="text-xs">View</span>
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
} 