'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/supabase';
import { ImagePreviewProps } from '@/types/components';
import { ProductDetails } from '@/types/product';

interface ProcessingImagesState {
    [key: string]: number;
}

const STORAGE_KEY = 'processing_images';

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

            // Load saved progress from localStorage
            const saved = Object.keys(localStorage)
                .filter(key => key.startsWith('progress_'))
                .reduce<{ [key: string]: number }>((acc, key) => {
                    const imagePath = key.replace('progress_', '');
                    const progress = parseFloat(localStorage.getItem(key) || '0');
                    acc[imagePath] = progress;
                    return acc;
                }, {});

            return { ...saved, ...processingImages };
        }
    );
    const imagesPerPage = 9;

    // Sort images by creation timestamp (extracted from filename)
    const sortedImages = useMemo(() => {
        return [...imagePaths].sort((a, b) => {
            // Extract timestamps from filenames (assuming format: userId/timestamp_index.ext)
            const getTimestamp = (path: string) => {
                const match = path.match(/\/(\d+)_/);
                return match ? parseInt(match[1]) : 0;
            };
            return getTimestamp(b) - getTimestamp(a); // Descending order (newest first)
        });
    }, [imagePaths]);

    const startIndex = (currentPage - 1) * imagesPerPage;
    const endIndex = startIndex + imagesPerPage;
    const displayedImages = sortedImages.slice(startIndex, endIndex);
    const showPlusButton = currentPage === 1 && sortedImages.length > imagesPerPage;

    const totalPages = Math.ceil(sortedImages.length / imagesPerPage);

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
    }, [processingImages]);

    // Cleanup stale items every minute
    useEffect(() => {
        const cleanup = () => {
            const now = Date.now();
            const staleTimeout = 5 * 60 * 1000; // 5 minutes

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
        };

        const interval = setInterval(cleanup, 60000);
        cleanup(); // Run once immediately

        return () => clearInterval(interval);
    }, []);

    if (isExpanded) return null;

    return (
        <>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Library</h2>
            <div className="grid grid-cols-3 gap-4">
                {displayedImages.map((imagePath, index) => {
                    const imageUrl = imagePath ?
                        `https://peyzpnmmgsxjydvpussg.supabase.co/storage/v1/object/public/product-images/${imagePath}` :
                        '';
                    const progress = localProcessingImages[imagePath];
                    const isProcessing = progress !== undefined && progress < 100;

                    return (
                        <div
                            key={index}
                            className={`relative cursor-pointer ${selectedImage === imagePath ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}
                            onClick={() => !isProcessing && handleImageClick(imagePath)}
                            onMouseEnter={() => setHoveredImage(imagePath)}
                            onMouseLeave={() => setHoveredImage(null)}
                        >
                            {isProcessing ? (
                                <div className="w-full h-full aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                    <span className="text-2xl font-bold text-gray-500 dark:text-gray-400">
                                        {Math.round(progress)}%
                                    </span>
                                </div>
                            ) : (
                                imageUrl && (
                                    <Image
                                        src={imageUrl}
                                        alt={`Uploaded Image ${index + 1}`}
                                        width={200}
                                        height={200}
                                        className="object-cover rounded-lg"
                                    />
                                )
                            )}
                            {selectedImage === imagePath && hoveredImage === imagePath && (
                                <button
                                    className="absolute top-0 right-0 bg-red-500 text-white rounded-tr-lg rounded-bl-md w-5 h-5 flex items-center justify-center text-xs"
                                    onClick={(e) => handleImageRemove(imagePath, e)}
                                >
                                    &times;
                                </button>
                            )}
                        </div>
                    );
                })}
                {showPlusButton && (
                    <div className="col-start-3 flex items-center justify-end">
                        <div
                            className="text-2xl font-bold cursor-pointer rounded-lg w-full h-full flex items-center justify-center bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-300 ease-in-out"
                            onClick={() => onPageChange(currentPage + 1)}
                        >
                            +
                        </div>
                    </div>
                )}
            </div>
            {currentPage > 1 && totalPages > 1 && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="flex items-center justify-start">
                        <button
                            className="text-2xl font-bold cursor-pointer rounded-lg w-full h-full flex items-center justify-center bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out"
                            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                        >
                            &lt;
                        </button>
                    </div>
                    <div></div>
                    {currentPage < totalPages && (
                        <div className="flex items-center justify-end">
                            <button
                                className="text-2xl font-bold cursor-pointer rounded-lg w-full h-full flex items-center justify-center bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out"
                                onClick={() => onPageChange(currentPage + 1)}
                            >
                                &gt;
                            </button>
                        </div>
                    )}
                </div>
            )}
        </>
    );
} 