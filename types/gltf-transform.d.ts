declare module '@gltf-transform/core' {
    export class Document {
        transform(...transforms: any[]): Promise<void>;
        // Add other methods as needed
    }
    export class NodeIO {
        registerExtensions(extensions: any): this;
        registerDependencies(deps: any): this;
        readBinary(buffer: Uint8Array): Promise<Document>;
        writeBinary(document: Document): Promise<ArrayBuffer>;
    }
    export function transform(...transforms: any[]): any;
    export function dedup(): any;
    export function prune(): any;
    export function draco(): any;
    export function resample(): any;
    export function quantize(): any;
}

declare module '@gltf-transform/extensions' {
    export const ALL_EXTENSIONS: any[];
}

declare module '@gltf-transform/functions' {
    export function meshopt(): any;
}

declare module 'fbx2gltf' {
    export default function(input: string, output: string): Promise<void>;
}

declare module 'obj2gltf' {
    interface Options {
        binary?: boolean;
        separate?: boolean;
        separateTextures?: boolean;
        checkTransparency?: boolean;
        secure?: boolean;
        // Add other options as needed
    }
    
    interface Result {
        glb: Uint8Array;
    }
    
    export default function(input: string | Buffer, options?: Options): Promise<Result>;
}

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
        // Add other options as needed
    }

    interface OptimizeResult {
        glb: Buffer;
    }

    export function optimize(
        gltf: Buffer | string | object,
        options?: OptimizeOptions
    ): Promise<OptimizeResult>;
}

declare module 'draco3d' {
    export function createDecoderModule(): Promise<any>;
    export function createEncoderModule(): Promise<any>;
    export default { createDecoderModule, createEncoderModule };
} 