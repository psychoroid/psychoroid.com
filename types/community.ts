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
    tags: string[];
    created_at: string;
    updated_at: string;
} 