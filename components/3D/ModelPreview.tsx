'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Environment, ContactShadows, Stage } from '@react-three/drei';
import Loader from '@/components/design/loader';
import Image from 'next/image';
import { PreviewModel } from './PreviewModel';

interface ModelPreviewProps {
    modelUrl: string;
    imageUrl?: string;
    small?: boolean;
    bucket?: string;
    canvasId?: string;
    onError?: (error: Error) => void;
}

export function ModelPreview({ modelUrl, imageUrl, small = false, bucket, canvasId = 'preview-canvas', onError }: ModelPreviewProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (error && onError) {
            onError(new Error(error));
        }
    }, [error, onError]);

    const getStorageUrl = (path: string) => {
        try {
            if (path.startsWith('http')) return path;

            const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            if (!baseUrl) throw new Error('Supabase URL not configured');

            // For default model, use the provided bucket
            if (bucket) {
                // Remove bucket name if it's already in the path
                const cleanPath = path.replace(`${bucket}/`, '');
                return `${baseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`;
            }

            // For user models, use the path as is
            const parts = path.split('/');
            if (parts.length < 2) throw new Error('Invalid storage path format');

            const pathBucket = parts[0];
            const filePath = parts.slice(1).join('/');

            return `${baseUrl}/storage/v1/object/public/${pathBucket}/${filePath}`;
        } catch (error) {
            console.error('Error generating storage URL:', error);
            return path;
        }
    };

    if (error) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
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

    return (
        <div className="relative w-full h-full" style={{ contain: 'strict' }}>
            <Canvas
                id={canvasId}
                frameloop="demand"
                camera={{
                    position: [0, 0, small ? 2.2 : 2.4],
                    fov: 45,
                    near: 0.1,
                    far: 1000
                }}
                style={{ background: 'none' }}
                gl={{
                    alpha: true,
                    antialias: true,
                    preserveDrawingBuffer: true,
                    premultipliedAlpha: false,
                    failIfMajorPerformanceCaveat: false,
                    toneMapping: 3, // ACESFilmicToneMapping
                    toneMappingExposure: 1.2
                }}
            >
                {/* Main lighting setup */}
                <Stage
                    intensity={1}
                    environment="city"
                    adjustCamera={false}
                    shadows={false}
                >
                    <Suspense fallback={
                        <Html center>
                            <div className="w-full h-full flex items-center justify-center">
                                <Loader />
                            </div>
                        </Html>
                    }>
                        <PreviewModel
                            url={getStorageUrl(modelUrl)}
                            small={small}
                            onLoad={() => setIsLoading(false)}
                            gridView={!small}
                        />
                    </Suspense>
                </Stage>

                {/* Additional lighting for better visibility */}
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

                {/* Environment and effects */}
                <Environment preset="city" />
                <ContactShadows
                    opacity={0.4}
                    scale={10}
                    blur={2}
                    far={4}
                    resolution={256}
                    color="#000000"
                />

                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    enableRotate={true}
                    autoRotate={true}
                    autoRotateSpeed={2}
                    makeDefault
                />
            </Canvas>
        </div>
    );
} 