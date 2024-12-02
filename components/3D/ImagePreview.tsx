'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface ImagePreviewProps {
    imagePaths: string[];
    selectedImage: string | null;
    onImageClick: (imagePath: string) => void;
    onImageRemove: (imagePath: string) => void;
    currentPage: number;
    onPageChange: (page: number) => void;
}

export function ImagePreview({
    imagePaths,
    selectedImage,
    onImageClick,
    onImageRemove,
    currentPage,
    onPageChange,
}: ImagePreviewProps) {
    const [hoveredImage, setHoveredImage] = useState<string | null>(null);
    const imagesPerPage = 9;

    const startIndex = (currentPage - 1) * imagesPerPage;
    const endIndex = startIndex + imagesPerPage;
    const displayedImages = imagePaths.slice(startIndex, endIndex);

    const totalPages = Math.ceil(imagePaths.length / imagesPerPage);

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
                                    className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-md w-5 h-5 flex items-center justify-center text-xs"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onImageRemove(imagePath);
                                    }}
                                >
                                    &times;
                                </button>
                            )}
                        </div>
                    );
                })}
                {currentPage < totalPages && (
                    <div
                        className="flex items-center justify-center text-4xl font-bold text-blue-500 cursor-pointer"
                        onClick={() => onPageChange(currentPage + 1)}
                    >
                        +
                    </div>
                )}
            </div>
            {totalPages > 1 && (
                <div className="mt-4 flex justify-center space-x-2">
                    <button
                        className="px-2 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                    >
                        &lt;
                    </button>
                    <button
                        className="px-2 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        &gt;
                    </button>
                </div>
            )}
        </>
    );
} 