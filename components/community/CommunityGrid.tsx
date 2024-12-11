'use client';

import { CommunityItem } from './CommunityItem';
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 px-4">
            {products.map((product) => (
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
    );
} 