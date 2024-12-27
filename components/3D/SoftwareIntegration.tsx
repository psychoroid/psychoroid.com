"use client";

import { FC, useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { MAYAIcon } from '@/components/icons/MAYAIcon';
import { UnityIcon } from '@/components/icons/UnityIcon';
import { UnrealIcon } from '@/components/icons/UnrealIcon';
import { CINEMA4DIcon } from '@/components/icons/CINEMA4D';
import { ZapierIcon } from '@/components/icons/ZapierIcon';
import { supabase } from '@/lib/supabase/supabase';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import * as THREE from 'three';

interface SoftwareIntegrationProps {
    modelUrl: string;
}

const SoftwareProtocols = {
    BLENDER: 'blender://',
    MAYA: 'maya://',
    CINEMA4D: 'cinema4d://',
    UNREAL: 'com.epicgames.launcher://',
    UNITY: 'unityhub://editor/new'
} as const;

type SoftwareType = keyof typeof SoftwareProtocols;

const SoftwareIntegration: FC<SoftwareIntegrationProps> = ({ modelUrl }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const convertModel = async (modelUrl: string, format: 'obj' | 'fbx' | 'gltf' | 'stl'): Promise<string> => {
        setIsConverting(true);
        const conversionToast = toast.loading(`Converting model to ${format.toUpperCase()}...`);

        try {
            // Download the GLB model
            const modelResponse = await fetch(modelUrl);
            if (!modelResponse.ok) {
                throw new Error(`Failed to fetch model: ${modelResponse.statusText}`);
            }
            const modelBuffer = await modelResponse.arrayBuffer();

            // Set up loaders
            const dracoLoader = new DRACOLoader();
            dracoLoader.setDecoderPath('/draco/');
            const loader = new GLTFLoader();
            loader.setDRACOLoader(dracoLoader);

            // Create scene and load model
            const scene = new THREE.Scene();
            const gltf = await loader.parseAsync(modelBuffer, '');
            scene.add(gltf.scene);

            let convertedData: Blob;

            // Convert based on format
            switch (format) {
                case 'obj':
                    const objExporter = new OBJExporter();
                    const objData = objExporter.parse(scene);
                    convertedData = new Blob([objData], { type: 'model/obj' });
                    break;

                case 'stl':
                    const stlExporter = new STLExporter();
                    const stlData = stlExporter.parse(scene, { binary: true });
                    convertedData = new Blob([stlData], { type: 'model/stl' });
                    break;

                case 'gltf':
                    const gltfExporter = new GLTFExporter();
                    convertedData = await new Promise((resolve, reject) => {
                        gltfExporter.parse(
                            scene,
                            (result) => {
                                const text = JSON.stringify(result, null, 2);
                                resolve(new Blob([text], { type: 'model/gltf+json' }));
                            },
                            reject,
                            { binary: false }
                        );
                    });
                    break;

                case 'fbx':
                    // For FBX, we'll use the API endpoint
                    const glbExporter = new GLTFExporter();
                    const glbData = await new Promise<ArrayBuffer>((resolve, reject) => {
                        glbExporter.parse(
                            scene,
                            (result) => resolve(result as ArrayBuffer),
                            reject,
                            { binary: true }
                        );
                    });

                    // Upload GLB to temporary storage
                    const tempFileName = `temp-${Date.now()}.glb`;
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

                    // Convert to FBX using the API
                    const fbxResponse = await fetch('/api/convert-fbx', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: tempUrl })
                    });

                    if (!fbxResponse.ok) throw new Error('FBX conversion failed');
                    const fbxData = await fbxResponse.arrayBuffer();
                    convertedData = new Blob([fbxData], { type: 'application/octet-stream' });
                    break;
            }

            // Upload the converted file
            const fileName = `converted-${Date.now()}.${format}`;
            const { data, error } = await supabase.storage
                .from('converted-models')
                .upload(fileName, convertedData, {
                    contentType: format === 'fbx' ? 'application/octet-stream' : `model/${format}`,
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) throw error;

            // Get the public URL
            const { data: { publicUrl } } = supabase.storage
                .from('converted-models')
                .getPublicUrl(fileName);

            toast.dismiss(conversionToast);
            toast.success('Model converted successfully');
            return publicUrl;

        } catch (error) {
            toast.dismiss(conversionToast);
            console.error('Conversion error:', error);
            throw error;
        } finally {
            setIsConverting(false);
        }
    };

    const handleDirectOpen = async (software: SoftwareType) => {
        try {
            const assetUrl = modelUrl.startsWith('http') ? modelUrl :
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-models/${modelUrl}`;

            let protocolUrl = '';

            // Handle each software with its preferred format
            switch (software) {
                case 'UNITY': {
                    try {
                        const objUrl = await convertModel(assetUrl, 'obj');
                        // Open Unity Hub with new project command
                        window.location.href = `${SoftwareProtocols.UNITY}`;
                        setIsOpen(false);
                        toast.success("Creating new Unity project...", {
                            duration: 12000,
                            action: {
                                label: "Download",
                                onClick: () => {
                                    window.open(objUrl, '_blank');
                                    toast.info("Once your project is created: Assets > Import New Asset > Select the downloaded OBJ file", {
                                        duration: 10000
                                    });
                                }
                            }
                        });
                        return;
                    } catch (error) {
                        toast.error('Failed to convert model for Unity');
                        return;
                    }
                }

                case 'MAYA': {
                    try {
                        const fbxUrl = await convertModel(assetUrl, 'fbx');
                        window.location.href = `${SoftwareProtocols.MAYA}`;
                        setIsOpen(false);
                        toast.success("Maya opened! Click on the button to get the model file", {
                            duration: 15000,
                            action: {
                                label: "Download FBX",
                                onClick: () => window.open(fbxUrl, '_blank')
                            }
                        });
                        return;
                    } catch (error) {
                        toast.error('Failed to convert model for Maya');
                        return;
                    }
                }

                case 'BLENDER': {
                    try {
                        const gltfUrl = await convertModel(assetUrl, 'gltf');
                        window.location.href = `${SoftwareProtocols.BLENDER}`;
                        setIsOpen(false);
                        toast.success("Blender opened! Click on the button to get the model file", {
                            duration: 15000,
                            action: {
                                label: "Download GLTF",
                                onClick: () => window.open(gltfUrl, '_blank')
                            }
                        });
                        return;
                    } catch (error) {
                        toast.error('Failed to convert model for Blender');
                        return;
                    }
                }

                case 'CINEMA4D': {
                    try {
                        const fbxUrl = await convertModel(assetUrl, 'fbx');
                        window.location.href = `${SoftwareProtocols.CINEMA4D}`;
                        setIsOpen(false);
                        toast.success("Cinema 4D opened! Click on the button to get the model file", {
                            duration: 15000,
                            action: {
                                label: "Download FBX",
                                onClick: () => window.open(fbxUrl, '_blank')
                            }
                        });
                        return;
                    } catch (error) {
                        toast.error('Failed to convert model for Cinema 4D');
                        return;
                    }
                }

                case 'UNREAL': {
                    try {
                        const fbxUrl = await convertModel(assetUrl, 'fbx');
                        window.location.href = `${SoftwareProtocols.UNREAL}`;
                        setIsOpen(false);
                        toast.success("Unreal Engine opened! Click on the button to get the model file", {
                            duration: 15000,
                            action: {
                                label: "Download FBX",
                                onClick: () => window.open(fbxUrl, '_blank')
                            }
                        });
                        return;
                    } catch (error) {
                        toast.error('Failed to convert model for Unreal Engine');
                        return;
                    }
                }
            }
        } catch (error) {
            toast.error("Failed to open software. Please try again.");
        }
    };

    return (
        <div className="absolute left-4 top-4 z-10" ref={menuRef}>
            <div className="relative flex items-center gap-1">
                <Button
                    variant="ghost"
                    className="w-[35px] h-[35px] p-0 rounded-none bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 backdrop-blur-sm border border-border/50"
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={isConverting}
                >
                    <ZapierIcon width={25} height={25} />
                </Button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center gap-1"
                        >
                            <Button
                                variant="ghost"
                                className="w-[35px] h-[35px] p-0 rounded-none bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 backdrop-blur-sm border border-border/50"
                                onClick={() => handleDirectOpen('MAYA')}
                                disabled={isConverting}
                            >
                                <MAYAIcon width={25} height={25} />
                            </Button>

                            <Button
                                variant="ghost"
                                className="w-[35px] h-[35px] p-0 rounded-none bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 backdrop-blur-sm border border-border/50"
                                onClick={() => handleDirectOpen('CINEMA4D')}
                                disabled={isConverting}
                            >
                                <CINEMA4DIcon width={25} height={25} />
                            </Button>

                            <Button
                                variant="ghost"
                                className="w-[35px] h-[35px] p-0 rounded-none bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 backdrop-blur-sm border border-border/50"
                                onClick={() => handleDirectOpen('UNITY')}
                                disabled={isConverting}
                            >
                                <UnityIcon width={25} height={25} />
                            </Button>

                            <Button
                                variant="ghost"
                                className="w-[35px] h-[35px] p-0 rounded-none bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 backdrop-blur-sm border border-border/50"
                                onClick={() => handleDirectOpen('UNREAL')}
                                disabled={isConverting}
                            >
                                <UnrealIcon width={25} height={25} />
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default SoftwareIntegration; 