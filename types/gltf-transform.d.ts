declare module '@gltf-transform/core' {
    export class Document {
        transform(...transforms: any[]): Promise<void>;
    }

    export class NodeIO {
        registerExtensions(extensions: any[]): this;
        readBinary(buffer: Uint8Array): Promise<Document>;
        writeBinary(document: Document): Promise<Uint8Array>;
    }
}

declare module '@gltf-transform/extensions' {
    const ALL_EXTENSIONS: any[];
    export { ALL_EXTENSIONS };
}

declare module '@gltf-transform/functions' {
    export function transform(...transforms: any[]): any;
    
    interface TransformFunction {
        (): (doc: any) => Promise<void>;
    }

    const functions = {
        dedup: (): TransformFunction => (() => Promise.resolve()),
        draco: (): TransformFunction => (() => Promise.resolve()),
        resample: (): TransformFunction => (() => Promise.resolve()),
        prune: (): TransformFunction => (() => Promise.resolve()),
        meshopt: (): TransformFunction => (() => Promise.resolve())
    };

    export default functions;
}

declare module 'fbx2gltf' {
    const convert: (input: string, output: string) => Promise<void>;
    export default convert;
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