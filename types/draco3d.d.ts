declare module 'draco3d' {
    interface DracoModuleOptions {
        wasmBinary?: ArrayBuffer;
        jsPath?: string;
    }

    export function createDecoderModule(options?: DracoModuleOptions): Promise<any>;
    export function createEncoderModule(options?: DracoModuleOptions): Promise<any>;

    const draco3d: {
        createDecoderModule: typeof createDecoderModule;
        createEncoderModule: typeof createEncoderModule;
    };

    export default draco3d;
} 