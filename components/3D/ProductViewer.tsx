'use client';

import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Product } from './Product';
import { ProductViewerProps, ModelState } from '@/types/components';
import { Vector3 } from 'three';

export function ProductViewer({ imagePath, modelUrl, isRotating = true, zoom = 1, isExpanded = false, onClose }: ProductViewerProps) {
    const controlsRef = useRef<any>(null);
    const [modelState, setModelState] = useState<ModelState>({
        rotation: [0, 0, 0] as [number, number, number],
        position: [0, 0, 0] as [number, number, number],
        scale: [1, 1, 1] as [number, number, number]
    });

    // Properly type the camera position as a fixed-length tuple
    const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([0, 0, 5]);
    const [controlsState, setControlsState] = useState({
        target: [0, 0, 0] as [number, number, number],
        zoom: zoom
    });

    const imageUrl = imagePath ? `https://peyzpnmmgsxjydvpussg.supabase.co/storage/v1/object/public/product-images/${imagePath}` : undefined;

    useEffect(() => {
        if (controlsRef.current) {
            controlsRef.current.autoRotate = isRotating;
        }
    }, [isRotating]);

    const handleControlsChange = () => {
        if (controlsRef.current) {
            const controls = controlsRef.current;
            const position = controls.object.position;
            const target = controls.target;

            setCameraPosition([position.x, position.y, position.z]);
            setControlsState({
                target: [target.x, target.y, target.z] as [number, number, number],
                zoom: controls.object.zoom
            });
        }
    };

    // Convert array to Vector3 for Three.js
    const cameraPositionVector = new Vector3(...cameraPosition);
    const targetVector = new Vector3(...controlsState.target);

    const renderCanvas = (expanded: boolean) => (
        <Canvas
            gl={{ preserveDrawingBuffer: true }}
            camera={{ position: cameraPositionVector }}
            style={{ width: '100%', height: '100%' }}
        >
            <PerspectiveCamera
                makeDefault
                position={cameraPositionVector}
                zoom={controlsState.zoom}
            />
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
            <Suspense fallback={null}>
                <Product
                    imageUrl={imageUrl}
                    modelUrl={modelUrl}
                    isRotating={isRotating}
                    zoom={zoom}
                    modelState={modelState}
                    onModelStateChange={handleModelStateChange}
                />
            </Suspense>
            <OrbitControls
                ref={controlsRef}
                enableZoom={true}
                enablePan={true}
                enableRotate={true}
                autoRotate={isRotating}
                autoRotateSpeed={2}
                onChange={handleControlsChange}
                target={targetVector}
                minDistance={2}
                maxDistance={20}
            />
        </Canvas>
    );

    const handleModelStateChange = (newState: ModelState) => {
        setModelState(newState);
    };

    const handleClose = () => {
        if (controlsRef.current) {
            handleControlsChange();
        }
        onClose?.();
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isExpanded) {
                handleClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isExpanded]);

    return (
        <>
            {isExpanded ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={handleClose}>
                    <div className="absolute inset-0 bg-black bg-opacity-50"></div>
                    <div className="relative w-full h-full max-w-7xl mx-auto cursor-default" onClick={(e) => e.stopPropagation()}>
                        <div className="w-full h-full flex items-center justify-center">
                            {renderCanvas(true)}
                        </div>
                        <div className="absolute top-4 right-4 flex items-center space-x-2">
                            <button
                                className="bg-white bg-opacity-20 text-white px-2 py-1 rounded-md text-sm focus:outline-none hover:bg-opacity-30 transition duration-200"
                                onClick={handleClose}
                            >
                                ESC
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-full w-full rounded-lg">
                    {renderCanvas(false)}
                </div>
            )}
        </>
    );
}