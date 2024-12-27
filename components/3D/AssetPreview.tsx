'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html, Environment, ContactShadows, Stage } from '@react-three/drei';
import Loader from '@/components/design/loader';
import Image from 'next/image';
import { StaticPreviewModel } from './StaticPreviewModel';
import dynamic from 'next/dynamic';

interface AssetPreviewProps {
    modelUrl: string;
    imageUrl?: string;
    small?: boolean;
    bucket?: string;
    canvasId?: string;
}

// Error Boundary Component
class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">
                        Failed to load preview
                    </span>
                </div>
            );
        }

        return this.props.children;
    }
}

// Dynamically import Canvas with no SSR
const DynamicCanvas = dynamic(
    () => import('@react-three/fiber').then(mod => mod.Canvas),
    { ssr: false }
);

export function AssetPreview({ modelUrl, imageUrl, small = false, bucket, canvasId = 'preview-canvas' }: AssetPreviewProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [key, setKey] = useState(0);
    const [modelLoaded, setModelLoaded] = useState(false);

    // Update key when modelUrl changes
    useEffect(() => {
        setKey(prev => prev + 1);
        setIsLoading(true);
        setModelLoaded(false);
    }, [modelUrl]);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Fixed camera position for consistent view
    const CAMERA_POSITION: [number, number, number] = [-1.5, 1, 1.5];

    const getStorageUrl = (path: string, type: 'model' | 'image' = 'model') => {
        try {
            if (!path) return '';
            if (path.startsWith('http')) return path;

            const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            if (!baseUrl) throw new Error('Supabase URL not configured');

            if (bucket) {
                const cleanPath = path.replace(`${bucket}/`, '');
                return `${baseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`;
            }

            // Determine the correct bucket based on type
            const bucketName = type === 'model' ? 'product-models' : 'product-images';

            // Handle paths that might already include the bucket name
            const cleanPath = path.replace(`${bucketName}/`, '');

            return `${baseUrl}/storage/v1/object/public/${bucketName}/${cleanPath}`;
        } catch (error) {
            console.error('Error generating storage URL:', error);
            return '';
        }
    };

    const handleModelLoad = () => {
        setIsLoading(false);
        setModelLoaded(true);
    };

    // Get full URLs
    const fullImageUrl = imageUrl ? getStorageUrl(imageUrl, 'image') : '';
    const fullModelUrl = modelUrl ? getStorageUrl(modelUrl, 'model') : '';

    if (error) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                {fullImageUrl ? (
                    <Image
                        src={fullImageUrl}
                        alt="Model preview"
                        layout="fill"
                        objectFit="cover"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center p-4 text-center">
                        <span className="text-xs text-muted-foreground">
                            {error || 'Preview not available'}
                        </span>
                    </div>
                )}
            </div>
        );
    }

    if (!isClient) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <Loader />
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div className="relative w-full h-full" style={{ contain: 'strict' }}>
                {/* Show image while model is loading */}
                {!modelLoaded && fullImageUrl && (
                    <div className="absolute inset-0 z-10 transition-opacity duration-300">
                        <Image
                            src={fullImageUrl}
                            alt="Model preview"
                            layout="fill"
                            objectFit="cover"
                            priority
                        />
                    </div>
                )}

                <DynamicCanvas
                    key={`canvas-${key}`}
                    id={canvasId}
                    frameloop="demand"
                    camera={{
                        position: CAMERA_POSITION,
                        fov: 45,
                        near: 0.1,
                        far: 1000
                    }}
                    style={{
                        background: 'none',
                        opacity: modelLoaded ? 1 : 0,
                        transition: 'opacity 0.3s ease-in-out'
                    }}
                    gl={{
                        alpha: true,
                        antialias: true,
                        preserveDrawingBuffer: true,
                        premultipliedAlpha: false,
                        failIfMajorPerformanceCaveat: false,
                        powerPreference: "high-performance",
                        toneMapping: 3,
                        toneMappingExposure: 1.2
                    }}
                >
                    <Stage
                        intensity={1}
                        environment="city"
                        adjustCamera={false}
                        shadows={false}
                        preset="rembrandt"
                    >
                        <Suspense fallback={
                            <Html center>
                                <div className="w-full h-full flex items-center justify-center">
                                    <Loader />
                                </div>
                            </Html>
                        }>
                            <StaticPreviewModel
                                key={`model-${key}`}
                                url={fullModelUrl}
                                small={small}
                                onLoad={handleModelLoad}
                            />
                        </Suspense>
                    </Stage>

                    <ambientLight intensity={0.8} />
                    <directionalLight
                        position={[5, 5, 5]}
                        intensity={1.5}
                        castShadow={false}
                    />
                    <directionalLight
                        position={[-5, 5, -5]}
                        intensity={1}
                        castShadow={false}
                    />

                    <Environment preset="city" />
                    <ContactShadows
                        opacity={0.4}
                        scale={10}
                        blur={2}
                        far={4}
                        resolution={256}
                        color="#000000"
                    />
                </DynamicCanvas>
            </div>
        </ErrorBoundary>
    );
} 