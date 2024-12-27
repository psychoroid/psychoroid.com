'use client';

import { useState, useRef, useEffect } from 'react';
import { Download } from 'lucide-react';
import { supabase } from '@/lib/supabase/supabase';
import toast from 'react-hot-toast';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import type {
    ModelFormat,
    FormatCategories,
    ConversionStatus,
    DownloadModalProps,
    ModelContentType
} from '@/types/models';
import { getStorageUrl } from '@/lib/utils/storage';

const EXPORT_FORMATS: FormatCategories = {
    '3D & Gaming': [
        { name: 'GLB', ext: 'glb', desc: 'Standard 3D format' },
        { name: 'OBJ', ext: 'obj', desc: 'For 3D modeling' },
        { name: 'GLTF', ext: 'gltf', desc: 'For web & three.js' },
        { name: 'FBX', ext: 'fbx', desc: 'For 3D modeling' },
    ],
    'CAD & Manufacturing': [
        { name: 'STL', ext: 'stl', desc: 'For 3D printing' },
        { name: 'STEP', ext: 'step', desc: 'For CAD software' },
    ],
    'E-commerce & Web': [
        { name: 'USDZ', ext: 'usdz', desc: 'For Apple AR' },
    ]
};

// Helper function to get content type
const getContentType = (format: ModelFormat): ModelContentType => {
    switch (format.toLowerCase() as ModelFormat) {
        case 'usdz':
            return 'model/vnd.usdz+zip';
        case 'obj':
            return 'model/obj';
        case 'stl':
            return 'model/stl';
        case 'glb':
            return 'model/gltf-binary';
        case 'gltf':
            return 'model/gltf+json';
        case 'fbx':
            return 'application/octet-stream';
        default:
            return 'application/octet-stream';
    }
};

const getModelUrl = (modelPath: string, bucket: string) => {
    // If it's already a full URL, return it
    if (modelPath.startsWith('http')) {
        return modelPath;
    }

    // Clean up the model path to remove any leading slashes
    const cleanPath = modelPath.replace(/^\/+/, '');

    // For default assets, always use the default-assets bucket
    if (cleanPath.startsWith('default-assets/')) {
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/default-assets/${cleanPath.replace('default-assets/', '')}`;
    }

    // For other models, use the product-models bucket
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-models/${cleanPath}`;
};

export function DownloadModal({ isOpen, onClose, product, onDownload }: DownloadModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const downloadingRef = useRef<boolean>(false);
    const [conversionStatus, setConversionStatus] = useState<ConversionStatus>({
        isConverting: false,
        progress: 0
    });

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Add progress simulation
    useEffect(() => {
        if (conversionStatus.isConverting) {
            let progress = 0;
            const interval = setInterval(() => {
                progress += 1;
                if (progress <= 90) { // Only go up to 90% for simulation
                    setConversionStatus(prev => ({
                        ...prev,
                        progress
                    }));
                }
            }, 1000); // Update every 500ms

            return () => clearInterval(interval);
        }
    }, [conversionStatus.isConverting]);

    const convertModel = async (format: ModelFormat): Promise<string> => {
        let dracoLoader: DRACOLoader | null = null;
        let scene: THREE.Scene | null = null;
        let convertedData: ArrayBuffer | Blob | null = null;

        try {
            setConversionStatus({ isConverting: true, progress: 0 });

            // Get the GLB model first
            const bucket = product.tags?.includes('template') ? 'default-assets' : 'product-models';
            const modelUrl = getModelUrl(product.model_path, bucket);

            // Debug the URL
            console.log('Attempting to fetch model from:', modelUrl);
            console.log('Product model path:', product.model_path);
            console.log('Bucket:', bucket);

            switch (format.toLowerCase()) {
                case 'usdz':
                    // Call our API endpoint to convert GLB to USDZ
                    const response = await fetch('/api/convert-model', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            modelUrl,
                            format: 'usdz',
                            quality: 'high',
                            productId: product.id
                        }),
                    });

                    if (!response.ok) {
                        throw new Error('Failed to convert to USDZ');
                    }

                    const { convertedUrl } = await response.json();
                    return convertedUrl;

                case 'gltf':
                case 'obj':
                case 'stl':
                case 'fbx':
                    // Download and parse the original GLB
                    const modelResponse = await fetch(modelUrl);
                    if (!modelResponse.ok) {
                        throw new Error(`Failed to fetch model: ${modelResponse.statusText}`);
                    }
                    const modelBuffer = await modelResponse.arrayBuffer();

                    // Set up loaders
                    dracoLoader = new DRACOLoader();
                    dracoLoader.setDecoderPath('/draco/');
                    const loader = new GLTFLoader();
                    loader.setDRACOLoader(dracoLoader);

                    // Create scene and load model
                    scene = new THREE.Scene();
                    const gltf = await loader.parseAsync(modelBuffer, '');
                    if (scene && gltf.scene) {
                        scene.add(gltf.scene);
                    }

                    // Handle format-specific conversion
                    switch (format) {
                        case 'gltf':
                            const gltfExporter = new GLTFExporter();
                            convertedData = await new Promise<Blob>((resolve, reject) => {
                                if (!scene) {
                                    reject(new Error('Scene not initialized'));
                                    return;
                                }
                                gltfExporter.parse(
                                    scene as THREE.Object3D,
                                    (result) => {
                                        if (result instanceof ArrayBuffer) {
                                            resolve(new Blob([result], { type: 'model/gltf-binary' }));
                                        } else {
                                            const text = JSON.stringify(result, null, 2);
                                            resolve(new Blob([text], { type: 'model/gltf+json' }));
                                        }
                                    },
                                    reject,
                                    { binary: false }
                                );
                            });
                            break;

                        case 'obj':
                            if (!scene) throw new Error('Scene not initialized');
                            const objExporter = new OBJExporter();
                            convertedData = new Blob([objExporter.parse(scene as THREE.Object3D)], { type: 'model/obj' });
                            break;

                        case 'stl':
                            if (!scene) throw new Error('Scene not initialized');
                            const stlExporter = new STLExporter();
                            convertedData = new Blob([stlExporter.parse(scene as THREE.Object3D, { binary: true })], { type: 'model/stl' });
                            break;

                        case 'fbx':
                            if (!scene) throw new Error('Scene not initialized');
                            const glbExporter = new GLTFExporter();
                            const glbData = await new Promise<ArrayBuffer>((resolve, reject) => {
                                glbExporter.parse(
                                    scene as THREE.Object3D,
                                    (result) => {
                                        if (result instanceof ArrayBuffer) {
                                            resolve(result);
                                        } else {
                                            const jsonString = JSON.stringify(result);
                                            const uint8Array = new TextEncoder().encode(jsonString);
                                            const arrayBuffer = new ArrayBuffer(uint8Array.byteLength);
                                            new Uint8Array(arrayBuffer).set(uint8Array);
                                            resolve(arrayBuffer);
                                        }
                                    },
                                    reject,
                                    { binary: true }
                                );
                            });

                            // Upload GLB to temporary storage
                            const tempFileName = `temp-${product.id}-${Date.now()}.glb`;
                            const { data: tempData, error: tempError } = await supabase.storage
                                .from('temp-conversions')
                                .upload(tempFileName, new Blob([glbData], { type: 'model/gltf-binary' }), {
                                    contentType: 'model/gltf-binary',
                                    upsert: true
                                });

                            if (tempError) throw tempError;

                            // Get temporary URL
                            const { data: { publicUrl: tempUrl } } = supabase.storage
                                .from('temp-conversions')
                                .getPublicUrl(tempFileName);

                            // Call conversion service
                            const fbxResponse = await fetch('/api/convert-fbx', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ url: tempUrl })
                            });

                            if (!fbxResponse.ok) {
                                const errorData = await fbxResponse.json();
                                throw errorData;
                            }

                            convertedData = new Blob([await fbxResponse.arrayBuffer()], {
                                type: 'application/octet-stream'
                            });
                            break;
                    }

                    // Upload the converted file
                    if (convertedData) {
                        const fileName = `converted-${product.id}-${Date.now()}.${format.toLowerCase()}`;
                        const { data, error } = await supabase.storage
                            .from('converted-models')
                            .upload(fileName,
                                convertedData instanceof Blob ? convertedData : new Blob([convertedData]),
                                {
                                    contentType: getContentType(format),
                                    cacheControl: '3600',
                                    upsert: true
                                }
                            );

                        if (error) throw error;

                        const { data: { publicUrl } } = supabase.storage
                            .from('converted-models')
                            .getPublicUrl(fileName);

                        return publicUrl;
                    }
                    throw new Error('Conversion failed');

                default:
                    throw new Error(`Unsupported format: ${format}`);
            }
        } catch (error) {
            setConversionStatus({ isConverting: false, progress: 0 });
            console.error('Conversion error details:', error);
            throw error;
        } finally {
            if (dracoLoader) {
                dracoLoader.dispose();
            }
            if (scene) {
                scene.clear();
                scene.remove(...(scene.children as THREE.Object3D[]));
            }
        }
    };

    const handleDownload = async (format: ModelFormat) => {
        if (downloadingRef.current) return;

        try {
            downloadingRef.current = true;
            let downloadUrl;

            // Start conversion progress
            setConversionStatus({ isConverting: true, progress: 0 });
            const conversionToast = toast.loading(`Processing ${format.toUpperCase()} file...`);

            try {
                // If format is not GLB, convert first
                if (format !== 'glb') {
                    downloadUrl = await convertModel(format);
                    // Jump to 100% when conversion is done
                    setConversionStatus(prev => ({ ...prev, progress: 100 }));
                    toast.dismiss(conversionToast);
                } else {
                    toast.dismiss(conversionToast);
                    // Get the model URL using the updated function
                    downloadUrl = getModelUrl(product.model_path, 'product-models');
                }

                // Verify the URL is accessible
                const checkResponse = await fetch(downloadUrl, { method: 'HEAD' });
                if (!checkResponse.ok) {
                    throw new Error(`File not found: ${checkResponse.statusText}`);
                }

                // Record download with format
                try {
                    const { error: downloadError } = await supabase.rpc('record_product_download', {
                        p_product_id: product.id,
                        p_format: format
                    });

                    if (downloadError) {
                        console.warn('Failed to record download:', downloadError);
                    }
                } catch (recordError) {
                    console.warn('Failed to record download:', recordError);
                }

                // Proceed with download
                const fileName = `${product.name.toLowerCase().replace(/\s+/g, '-')}.${format}`;
                const link = document.createElement('a');
                link.style.display = 'none';
                link.href = downloadUrl;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                onDownload(product.id);

                // Wait a moment before closing to show 100% progress
                setTimeout(() => {
                    onClose();
                    // Only reset conversion status after modal is closed
                    setTimeout(() => {
                        setConversionStatus({ isConverting: false, progress: 0 });
                    }, 300);
                }, 500);

                toast.success(`Downloading ${format.toUpperCase()} file`);

            } catch (error) {
                toast.dismiss(conversionToast);
                throw error;
            }

        } catch (error) {
            console.error('Error downloading model:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to download file');
            setConversionStatus({ isConverting: false, progress: 0 });
        } finally {
            setTimeout(() => {
                downloadingRef.current = false;
            }, 1000);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
            <div
                ref={modalRef}
                className="bg-background border border-border shadow-lg w-[300px] max-h-[400px] overflow-y-auto scrollbar-hide"
            >
                {conversionStatus.isConverting ? (
                    <div className="p-4">
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium">Converting model...</h3>
                            <div className="w-full bg-accent h-1">
                                <div
                                    className="bg-green-500 h-1 transition-all duration-300"
                                    style={{ width: `${conversionStatus.progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="p-4 border-b border-border">
                            <h3 className="font-medium text-sm">Download Format</h3>
                        </div>

                        <div className="p-2">
                            {Object.entries(EXPORT_FORMATS).map(([category, formats]) => (
                                <div key={category} className="mb-4">
                                    <h4 className="text-xs font-medium text-muted-foreground px-2 mb-1">
                                        {category}
                                    </h4>
                                    <div className="space-y-1">
                                        {formats.map((format) => (
                                            <button
                                                key={format.ext}
                                                onClick={() => handleDownload(format.ext)}
                                                className="w-full text-left px-2 py-1.5 hover:bg-accent text-sm flex items-center justify-between group"
                                            >
                                                <div>
                                                    <span className="font-medium">{format.name}</span>
                                                    <span className="text-xs text-muted-foreground ml-2">
                                                        {format.desc}
                                                    </span>
                                                </div>
                                                <Download className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
} 