'use client';

import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import Loader from '@/components/design/loader';
import Image from 'next/image';
import { PreviewModel } from './PreviewModel';

interface ModelPreviewProps {
    modelUrl: string;
    imageUrl?: string;
    small?: boolean;
    bucket?: string;
}

export function ModelPreview({ modelUrl, imageUrl, small = false, bucket }: ModelPreviewProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
        <div className="relative w-full h-full">
            <Canvas
                camera={{
                    position: [0, 0, small ? 2.2 : 2.4],
                    fov: 40,
                    near: 0.1,
                    far: 1000
                }}
                style={{ background: 'none' }}
                gl={{
                    alpha: true,
                    antialias: true,
                    preserveDrawingBuffer: true,
                    premultipliedAlpha: false
                }}
            >
                <ambientLight intensity={1.2} />
                <hemisphereLight
                    intensity={0.8}
                    groundColor="black"
                    color="#303030"
                />
                <directionalLight
                    position={[5, 5, 5]}
                    intensity={0.8}
                    castShadow
                />
                <directionalLight
                    position={[-5, 5, -5]}
                    intensity={0.8}
                    castShadow
                />

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
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    enableRotate={false}
                />
            </Canvas>
        </div>
    );
} 