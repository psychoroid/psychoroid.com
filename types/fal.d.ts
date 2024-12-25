export type ImageSizePreset = 'square_hd' | 'square' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9';

export type ImageSize = ImageSizePreset | {
    width: number;
    height: number;
};

export interface ImageGenerationInput {
    prompt: string;
    negative_prompt?: string;
    prompt_expansion?: boolean;
    image_size?: ImageSize;
    num_inference_steps?: number;
    seed?: number;
    guidance_scale?: number;
    sync_mode?: boolean;
    num_images?: number;
    enable_safety_checker?: boolean;
}

export interface Image {
    url: string;
    width?: number;
    height?: number;
    content_type?: string;
}

export interface GenerationResponse {
    images: Image[];
    prompt: string;
    num_images: number;
    has_nsfw_concepts?: boolean[];
    seed?: number;
}

export interface QueueStatus {
    status: 'IN_PROGRESS' | 'COMPLETED' | 'IN_QUEUE';
    logs?: Array<{ message: string }>;
} 