declare module 'gltf-pipeline' {
    interface DracoOptions {
        compressionLevel?: number;
        quantizePositionBits?: number;
        quantizeNormalBits?: number;
        quantizeTexcoordBits?: number;
        quantizeColorBits?: number;
        quantizeGenericBits?: number;
        uncompressedFallback?: boolean;
    }

    interface OptimizeOptions {
        dracoOptions?: DracoOptions;
        meshoptCompressionLevel?: number;
    }

    interface OptimizeResult {
        glb: Buffer;
    }

    export function optimize(
        gltf: Buffer | string | object,
        options?: OptimizeOptions
    ): Promise<OptimizeResult>;
} 