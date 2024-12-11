declare module 'obj2gltf' {
    interface Options {
        binary?: boolean;
        separate?: boolean;
        separateTextures?: boolean;
        checkTransparency?: boolean;
        secure?: boolean;
    }
    
    interface Result {
        glb: Uint8Array;
    }
    
    export default function(input: string | Buffer, options?: Options): Promise<Result>;
} 