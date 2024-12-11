export interface CommunityProduct {
    id: string;
    name: string;
    description: string;
    image_path: string;
    model_path: string;
    likes_count: number;
    downloads_count: number;
    views_count: number;
    created_at: string;
    updated_at: string;
    user_id: string;
    tags: string[];
    visibility?: string;
    is_featured?: boolean;
}

export interface CommunityGridProps {
    products: CommunityProduct[];
    onProductSelect: (product: CommunityProduct) => void;
    selectedProduct: CommunityProduct | null;
    onLike: (productId: string) => void;
    onDownload: (productId: string) => void;
    userLikes: Set<string>;
}

export interface ProductLike {
    product_id: string;
} 