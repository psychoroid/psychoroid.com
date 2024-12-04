'use client';

import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Product } from './Product';
import { ProductViewerProps } from '@/types/components';

export function ProductViewer({ imagePath, modelUrl, isRotating = true, zoom = 1, isExpanded = false, onClose }: ProductViewerProps) {
    const controlsRef = useRef<any>(null);

    const imageUrl = imagePath ? `https://peyzpnmmgsxjydvpussg.supabase.co/storage/v1/object/public/product-images/${imagePath}` : undefined;

    React.useEffect(() => {
        if (controlsRef.current) {
            controlsRef.current.autoRotate = isRotating;
        }
    }, [isRotating]);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isExpanded) {
                onClose?.();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isExpanded, onClose]);

    return (
        <>
            {isExpanded && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
                    <div className="absolute inset-0 bg-black bg-opacity-50"></div>
                    <div className="relative w-full h-full max-w-7xl mx-auto cursor-default" onClick={(e) => e.stopPropagation()}>
                        <div className="w-full h-full flex items-center justify-center">
                            <Canvas camera={{ position: [0, 0, 5] }} shadows>
                                <ambientLight intensity={0.5} />
                                <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
                                <Suspense fallback={null}>
                                    <Product imageUrl={imageUrl} modelUrl={modelUrl} isRotating={isRotating} zoom={zoom} />
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
                        <div className="absolute top-4 right-4 flex items-center space-x-2">
                            <button
                                className="bg-white bg-opacity-20 text-white px-2 py-1 rounded-md text-sm focus:outline-none hover:bg-opacity-30 transition duration-200"
                                onClick={onClose}
                            >
                                ESC
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="h-full w-full rounded-lg">
                <Canvas camera={{ position: [0, 0, 5] }} shadows>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
                    <Suspense fallback={null}>
                        <Product imageUrl={imageUrl} modelUrl={modelUrl} isRotating={isRotating} zoom={zoom} />
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
        </>
    );
}