'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/supabase';
import { ImagePreviewProps } from '@/types/components';
import { ProductDetails } from '@/types/product';
import { motion } from 'framer-motion';
import { cn } from '@/lib/actions/utils';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProcessingImagesState {
    [key: string]: number;
}

const STORAGE_KEY = 'processing_images';

const ITEMS_PER_PAGE = 10; // 2×4 grid
const MAX_PAGES = 20;

export function ImagePreview({
    imagePaths,
    selectedImage,
    onImageClick,
    onImageRemove,
    currentPage,
    onPageChange,
    isLoading,
    isExpanded = false,
    processingImages = {},
}: ImagePreviewProps) {
    const [hoveredImage, setHoveredImage] = useState<string | null>(null);
    const [localProcessingImages, setLocalProcessingImages] = useState<{ [key: string]: number }>(
        () => {
            if (typeof window === 'undefined') return {};
            return { ...processingImages };
        }
    );

    // Sort images by creation timestamp
    const sortedImages = useMemo(() => {
        return [...imagePaths].sort((a, b) => {
            const getTimestamp = (path: string) => {
                const match = path.match(/\/(\d+)_/);
                return match ? parseInt(match[1]) : 0;
            };
            return getTimestamp(b) - getTimestamp(a);
        });
    }, [imagePaths]);

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const displayedImages = sortedImages.slice(startIndex, endIndex);
    const totalPages = Math.ceil(sortedImages.length / ITEMS_PER_PAGE);

    const handleImageRemove = async (imagePath: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            const { error } = await supabase.rpc('toggle_product_visibility', {
                p_product_path: imagePath,
                p_user_id: user.id
            });

            if (error) throw error;

            onImageRemove(imagePath);
        } catch (error) {
            console.error('Error hiding image:', error);
        }
    };

    const handleImageClick = async (imagePath: string) => {
        try {
            const { data: productDetails, error } = await supabase
                .rpc('get_product_details', {
                    p_image_path: imagePath
                })
                .single<ProductDetails>();

            if (error) {
                console.error('Error fetching product details:', error);
                return;
            }

            if (productDetails && productDetails.model_path) {
                console.log('Switching to model:', productDetails.model_path);
                onImageClick(imagePath, productDetails.model_path);
            }
        } catch (error) {
            console.error('Error handling image click:', error);
        }
    };

    // Update local state when props change, but only if values are different
    useEffect(() => {
        const hasChanges = Object.entries(processingImages).some(
            ([key, value]) => localProcessingImages[key] !== value
        );

        if (hasChanges) {
            setLocalProcessingImages(prev => ({ ...prev, ...processingImages }));
        }
    }, [processingImages, localProcessingImages]);

    // Move the cleanup function outside useEffect to avoid the dependency
    const cleanup = useCallback(() => {
        const now = Date.now();
        const staleTimeout = 5 * 60 * 1000;

        setLocalProcessingImages(prev => {
            const updated = { ...prev };
            let hasChanges = false;

            Object.entries(updated).forEach(([path, progress]) => {
                const timestamp = parseInt(path.split('/')[1].split('_')[0]);
                if (progress >= 100 || now - timestamp > staleTimeout) {
                    delete updated[path];
                    localStorage.removeItem(`progress_${path}`);
                    hasChanges = true;
                }
            });

            return hasChanges ? updated : prev;
        });
    }, []);

    useEffect(() => {
        const interval = setInterval(cleanup, 60000);
        cleanup();

        return () => clearInterval(interval);
    }, [cleanup]);

    if (isExpanded) return null;

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col justify-between min-h-[580px] overflow-y-auto scrollbar-hide"
            >
                <div className="grid grid-cols-2 auto-rows-fr gap-4 w-full place-items-center p-2">
                    {displayedImages.map((imagePath, index) => {
                        const imageUrl = imagePath ?
                            `https://peyzpnmmgsxjydvpussg.supabase.co/storage/v1/object/public/product-images/${imagePath}` :
                            '';
                        const progress = localProcessingImages[imagePath];
                        const isProcessing = progress !== undefined && progress < 100;

                        return (
                            <div
                                key={index}
                                className={cn(
                                    "relative cursor-pointer",
                                    "w-[120px] h-[120px]",
                                    "group hover:shadow-lg transition-shadow duration-200",
                                    selectedImage === imagePath ? 'ring-2 ring-primary' : 'ring-1 ring-border'
                                )}
                                style={{
                                    width: '120px',
                                    height: '120px',
                                    flexShrink: 0
                                }}
                                onClick={() => !isProcessing && handleImageClick(imagePath)}
                                onMouseEnter={() => setHoveredImage(imagePath)}
                                onMouseLeave={() => setHoveredImage(null)}
                            >
                                {isProcessing ? (
                                    <div className="w-full h-full flex items-center justify-center bg-background/50">
                                        <span className="text-2xl font-bold text-muted-foreground">
                                            {Math.round(progress)}%
                                        </span>
                                    </div>
                                ) : (
                                    imageUrl && (
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={imageUrl}
                                                alt={`Uploaded Image ${index + 1}`}
                                                fill
                                                className="object-cover"
                                                sizes="120px"
                                                priority
                                            />
                                        </div>
                                    )
                                )}
                                {selectedImage === imagePath && hoveredImage === imagePath && (
                                    <button
                                        className={cn(
                                            "absolute top-2 right-2 w-6 h-6",
                                            "flex items-center justify-center",
                                            "bg-background/80 backdrop-blur-sm rounded-sm",
                                            "hover:bg-background/90 cursor-pointer",
                                            "transition-all duration-200",
                                            "border border-border"
                                        )}
                                        onClick={(e) => handleImageRemove(imagePath, e)}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 py-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
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
                            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </motion.div>
        </>
    );
} 