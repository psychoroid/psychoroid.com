'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { ImagePreviewProps } from '@/types/components';

export function ImagePreview({
    imagePaths,
    selectedImage,
    onImageClick,
    onImageRemove,
    currentPage,
    onPageChange,
    isLoading,
    isExpanded = false,
}: ImagePreviewProps) {
    const [hoveredImage, setHoveredImage] = useState<string | null>(null);
    const imagesPerPage = 9;

    const startIndex = (currentPage - 1) * imagesPerPage;
    const endIndex = startIndex + imagesPerPage;
    const displayedImages = imagePaths.slice(startIndex, endIndex);
    const showPlusButton = currentPage === 1 && imagePaths.length > imagesPerPage;

    const totalPages = Math.ceil(imagePaths.length / imagesPerPage);

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

    if (isExpanded) return null;

    return (
        <>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Library</h2>
            <div className="grid grid-cols-3 gap-4">
                {displayedImages.map((imagePath, index) => {
                    const imageUrl = imagePath ?
                        `https://peyzpnmmgsxjydvpussg.supabase.co/storage/v1/object/public/product-images/${imagePath}` :
                        '';

                    return (
                        <div
                            key={index}
                            className={`relative cursor-pointer ${selectedImage === imagePath ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}
                            onClick={() => onImageClick(imagePath)}
                            onMouseEnter={() => setHoveredImage(imagePath)}
                            onMouseLeave={() => setHoveredImage(null)}
                        >
                            {imageUrl && (
                                <Image
                                    src={imageUrl}
                                    alt={`Uploaded Image ${index + 1}`}
                                    width={200}
                                    height={200}
                                    className="object-cover rounded-lg"
                                />
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