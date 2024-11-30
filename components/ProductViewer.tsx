'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Product } from './Product';

interface ProductViewerProps {
    imageUrl?: string;
}

export function ProductViewer({ imageUrl }: ProductViewerProps) {
    return (
        <div className="h-[400px] w-full bg-gray-100 rounded-lg">
            <Canvas shadows>
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
                <Suspense fallback={null}>
                    <Product imageUrl={imageUrl} />
                </Suspense>
                <OrbitControls
                    enableZoom={true}
                    enablePan={true}
                    enableRotate={true}
                    autoRotate={true}
                    autoRotateSpeed={2}
                />
            </Canvas>
        </div>
    );
}