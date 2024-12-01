'use client';

import React from 'react';
import Image from 'next/image';

interface ImagePreviewProps {
    imagePath: string;
}

export function ImagePreview({ imagePath }: ImagePreviewProps) {
    const imageUrl = `https://peyzpnmmgsxjydvpussg.supabase.co/storage/v1/object/public/product-images/${imagePath}`;

    return (
        <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Image Preview</h2>
            <div className="w-full h-64 relative">
                <Image src={imageUrl} alt="Uploaded Image" fill className="object-contain" />
            </div>
        </div>
    );
} 