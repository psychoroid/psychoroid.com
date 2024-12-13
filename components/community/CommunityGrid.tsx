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
    // Filter for public products if needed
    const publicProducts = products.filter(product => product.visibility === 'public');

    return (
        <div className="-mx-8 md:-mx-16 lg:-mx-24">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 px-8 md:px-16 lg:px-24">
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