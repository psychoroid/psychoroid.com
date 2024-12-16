export interface ConversionRequest {
    modelUrl: string;
    format: string;
    quality?: 'high' | 'medium' | 'low';
    productId: string;
}

export interface ConversionResponse {
    success: boolean;
    convertedUrl?: string;
    error?: string;
} 