'use client';

import { useState, useRef, useEffect } from 'react';
import { Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { saveAs } from 'file-saver';
import { supabase } from '@/lib/supabase/supabase';
import toast from 'react-hot-toast';

const EXPORT_FORMATS = {
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

interface DownloadModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: {
        id: string;
        name: string;
        model_path: string;
        tags?: string[];
    };
    onDownload: (id: string) => void;
}

interface ConversionStatus {
    isConverting: boolean;
    progress: number;
}

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

    const convertModel = async (format: string): Promise<string> => {
        try {
            setConversionStatus({ isConverting: true, progress: 0 });

            // Ensure we have a valid model path
            if (!product.model_path) {
                throw new Error('No model path provided');
            }

            const response = await fetch('/api/convert-model', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    modelUrl: product.model_path,
                    format,
                    quality: 'high',
                    productId: product.id
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Conversion failed');
            }

            const data = await response.json();
            if (!data.convertedUrl) {
                throw new Error('No converted URL received');
            }

            setConversionStatus({ isConverting: false, progress: 100 });
            return data.convertedUrl;
        } catch (error) {
            setConversionStatus({ isConverting: false, progress: 0 });
            console.error('Conversion error details:', error);
            throw error;
        }
    };

    const handleDownload = async (format: string) => {
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