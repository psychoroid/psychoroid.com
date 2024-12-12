// Model conversion and export types
export type ModelFormat = 'gltf' | 'glb' | 'fbx' | 'obj' | 'stl' | 'usdz' | 'step';

export type FormatCategory = '3D & Gaming' | 'CAD & Manufacturing' | 'E-commerce & Web';

export interface FormatInfo {
    name: string;
    ext: ModelFormat;
    desc: string;
}

export interface FormatCategories {
    [key: string]: FormatInfo[];
}

export interface ConversionStatus {
    isConverting: boolean;
    progress: number;
}

export interface ModelProduct {
    id: string;
    name: string;
    model_path: string;
    tags?: string[];
}

export interface DownloadModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: ModelProduct;
    onDownload: (id: string) => void;
}

// Model conversion results
export type ConversionResult = ArrayBuffer | Blob;

// Export format content types
export type ModelContentType = 
    | 'model/gltf-binary'
    | 'model/gltf+json'
    | 'model/obj'
    | 'model/stl'
    | 'model/vnd.usdz+zip'
    | 'application/octet-stream'; 