import { ModelState, ProductProps as BaseProductProps, ProductViewerProps as BaseProductViewerProps } from './components';

export interface CommunityProduct {
    id: string;
    name: string;
    description: string;
    image_path: string;
    model_path: string;
    visibility: 'public' | 'private' | 'unlisted';
    likes_count: number;
    downloads_count: number;
    views_count: number;
    created_at: string;
    updated_at: string;
    user_id: string;
    tags: string[];
    is_featured?: boolean;
    username: string;
}

export interface DownloadModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: CommunityProduct;
    onDownload: (productId: string) => void;
}

// Extend the base ProductProps
export interface ProductProps extends BaseProductProps {
    showGrid?: boolean;
}

// Extend the base ProductViewerProps
export interface ProductViewerProps extends BaseProductViewerProps {
    modelUrl: string; // Make modelUrl required
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

export interface CommunityItemProps {
    product: CommunityProduct;
    onSelect: (product: CommunityProduct) => void;
    isSelected: boolean;
    onLike: (productId: string) => void;
    onDownload: (productId: string) => void;
    isLiked: boolean;
} 