'use client';

import { CommunityItem } from './CommunityItem';
import type { CommunityGridProps } from '@/types/community';

export function CommunityGrid({
    products,
    onProductSelect,
    onLike,
    onDownload,
    userLikes
}: CommunityGridProps) {
    // Filter for public products if needed
    const publicProducts = products.filter(product => product.visibility === 'public');

    return (
        <div className="w-full h-[calc(100vh-200px)]">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {publicProducts.map((product) => (
                    <CommunityItem
                        key={product.id}
                        product={product}
                        onSelect={onProductSelect}
                        onLike={onLike}
                        onDownload={onDownload}
                        isLiked={userLikes.has(product.id)}
                    />
                ))}
            </div>
        </div>
    );
} 