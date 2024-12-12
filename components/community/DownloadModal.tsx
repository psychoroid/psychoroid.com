'use client';

import { useState, useRef, useEffect } from 'react';
import { Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { saveAs } from 'file-saver';
import { supabase } from '@/lib/supabase/supabase';
import toast from 'react-hot-toast';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import * as THREE from 'three';
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
        { name: 'GLTF', ext: 'gltf', desc: 'For web & three.js' },
        { name: 'FBX', ext: 'fbx', desc: 'For Unity/Unreal' },
    ],
    'CAD & Manufacturing': [
        { name: 'OBJ', ext: 'obj', desc: 'For 3D modeling' },
        { name: 'STL', ext: 'stl', desc: 'For 3D printing' },
        { name: 'STEP', ext: 'step', desc: 'For CAD software' },
    ],
    'E-commerce & Web': [
        { name: 'USDZ', ext: 'usdz', desc: 'For Apple AR' },
        { name: 'GLB', ext: 'glb', desc: 'For web AR/VR' },
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

    const convertModel = async (format: ModelFormat): Promise<string> => {
        try {
            setConversionStatus({ isConverting: true, progress: 0 });

            // Ensure we have a valid model path
            if (!product.model_path) {
                throw new Error('No model path provided');
            }

            // Use the same URL construction logic as ModelPreview
            const bucket = product.tags?.includes('template') ? 'default-assets' : 'product-models';
            const modelUrl = getStorageUrl(product.model_path, bucket);

            // Download the GLB file
            const response = await fetch(modelUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch model: ${response.statusText}`);
            }
            const modelBuffer = await response.arrayBuffer();

            // Create Three.js scene and load model
            const scene = new THREE.Scene();
            const loader = new GLTFLoader();
            const gltf = await loader.parseAsync(modelBuffer, '');
            scene.add(gltf.scene);

            let convertedData;

            // Handle different format conversions
            switch (format.toLowerCase()) {
                case 'usdz':
                    const usdzExporter = new USDZExporter();
                    convertedData = await usdzExporter.parse(scene);
                    break;

                case 'gltf':
                    const gltfExporter = new GLTFExporter();
                    convertedData = await new Promise<Blob>((resolve, reject) => {
                        gltfExporter.parse(
                            scene,
                            (result) => {
                                if (result instanceof ArrayBuffer) {
                                    resolve(new Blob([result], { type: 'model/gltf-binary' }));
                                } else {
                                    // For JSON format (GLTF)
                                    const text = JSON.stringify(result, null, 2);
                                    resolve(new Blob([text], { type: 'model/gltf+json' }));
                                }
                            },
                            (error) => {
                                reject(error);
                            },
                            { binary: false }
                        );
                    });
                    break;

                case 'fbx':
                    // First export to GLB
                    const glbExporter = new GLTFExporter();
                    const glbData = await new Promise<ArrayBuffer>((resolve, reject) => {
                        glbExporter.parse(
                            scene,
                            (result) => {
                                if (result instanceof ArrayBuffer) {
                                    resolve(result);
                                } else {
                                    // Handle JSON result by converting to ArrayBuffer
                                    const jsonString = JSON.stringify(result);
                                    // Convert to Uint8Array first, then create a new ArrayBuffer
                                    const uint8Array = new TextEncoder().encode(jsonString);
                                    const arrayBuffer = new ArrayBuffer(uint8Array.byteLength);
                                    new Uint8Array(arrayBuffer).set(uint8Array);
                                    resolve(arrayBuffer);
                                }
                            },
                            (error) => reject(error),
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

                case 'obj':
                    const objExporter = new OBJExporter();
                    const objString = objExporter.parse(scene);
                    convertedData = new TextEncoder().encode(objString).buffer;
                    break;

                case 'stl':
                    const stlExporter = new STLExporter();
                    const stlString = stlExporter.parse(scene, { binary: true });
                    convertedData = stlString;
                    break;

                default:
                    throw new Error(`Unsupported format: ${format}`);
            }

            // Upload the converted file to Supabase
            const fileName = `converted-${product.id}-${Date.now()}.${format.toLowerCase()}`;
            const { data, error } = await supabase.storage
                .from('converted-models')
                .upload(fileName,
                    convertedData instanceof Blob ? convertedData :
                        new Blob([convertedData as ArrayBuffer], {
                            type: getContentType(format)
                        }), {
                    contentType: getContentType(format),
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) throw error;

            // Get the public URL
            const { data: { publicUrl } } = supabase.storage
                .from('converted-models')
                .getPublicUrl(fileName);

            setConversionStatus({ isConverting: false, progress: 100 });
            return publicUrl;

        } catch (error) {
            setConversionStatus({ isConverting: false, progress: 0 });
            console.error('Conversion error details:', error);
            throw error;
        }
    };

    const handleDownload = async (format: ModelFormat) => {
        if (downloadingRef.current) return;

        try {
            downloadingRef.current = true;
            let downloadUrl;

            // Show initial conversion message
            const conversionToast = toast.loading(`Processing ${format.toUpperCase()} file...`);

            try {
                // If format is not GLB, convert first
                if (format !== 'glb') {
                    downloadUrl = await convertModel(format);
                    toast.dismiss(conversionToast);
                } else {
                    toast.dismiss(conversionToast);
                    // Construct the full URL for GLB files
                    const bucket = product.tags?.includes('template') ? 'default-assets' : 'product-models';

                    // Clean up the model path to remove any duplicate 'default-assets/'
                    let cleanModelPath = product.model_path;
                    if (cleanModelPath.startsWith('default-assets/default-assets/')) {
                        cleanModelPath = cleanModelPath.replace('default-assets/default-assets/', 'default-assets/');
                    }

                    // If the model_path is already a full URL, use it directly
                    if (cleanModelPath.startsWith('http')) {
                        downloadUrl = cleanModelPath;
                    } else {
                        // Remove any leading slashes and construct the URL
                        cleanModelPath = cleanModelPath.replace(/^\/+/, '');
                        downloadUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${cleanModelPath}`;
                    }
                }

                // Verify the URL is accessible
                const checkResponse = await fetch(downloadUrl, { method: 'HEAD' });
                if (!checkResponse.ok) {
                    throw new Error(`File not found: ${checkResponse.statusText}`);
                }

                // Record download with format
                try {
                    const { error: downloadError } = await supabase.rpc('record_product_download', {
                        p_format: format,
                        p_product_id: product.id
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
                onClose();
                toast.success(`Downloading ${format.toUpperCase()} file`);

            } catch (error) {
                toast.dismiss(conversionToast);
                throw error;
            }

        } catch (error) {
            console.error('Error downloading model:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to download file');
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
                className="bg-background border border-border shadow-lg w-[300px] max-h-[400px] overflow-y-auto"
            >
                {conversionStatus.isConverting ? (
                    <div className="p-4">
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium">Converting model...</h3>
                            <div className="w-full bg-accent h-1">
                                <div
                                    className="bg-primary h-1 transition-all duration-300"
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