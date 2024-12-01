'use client';

import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Product } from './Product';

interface ProductViewerProps {
    imageUrl?: string;
    modelUrl?: string;
    isRotating?: boolean;
}

export function ProductViewer({ imageUrl, modelUrl, isRotating = true }: ProductViewerProps) {
    const controlsRef = useRef<any>(null);

    // Update controls when isRotating changes
    React.useEffect(() => {
        if (controlsRef.current) {
            controlsRef.current.autoRotate = isRotating;
        }
    }, [isRotating]);

    return (
        <div className="h-[400px] w-full bg-gray-100 rounded-lg">
            <Canvas shadows>
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
                <Suspense fallback={null}>
                    <Product imageUrl={imageUrl} modelUrl={modelUrl} isRotating={isRotating} />
                </Suspense>
                <OrbitControls
                    ref={controlsRef}
                    enableZoom={true}
                    enablePan={true}
                    enableRotate={true}
                    autoRotate={isRotating}
                    autoRotateSpeed={2}
                />
            </Canvas>
        </div>
    );
}