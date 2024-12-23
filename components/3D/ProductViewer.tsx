'use client';

import React, { Suspense, useRef, useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Product } from './Product';
import { ProductViewerProps, ModelState } from '@/types/components';
import { Vector3 } from 'three';
import { ProductControls } from './ProductControls';

// Update initial state constants for better front view
const INITIAL_CAMERA_POSITION: [number, number, number] = [0, 0, 3]; // Moved camera closer and at eye level
const INITIAL_TARGET: [number, number, number] = [0, 0, 0];
const INITIAL_ZOOM = 1.5; // Increased initial zoom

// Add initial model rotation to face forward
const INITIAL_MODEL_ROTATION: [number, number, number] = [0, Math.PI, 0]; // Rotate 180 degrees around Y axis

export function ProductViewer({ imagePath, modelUrl, isRotating = true, zoom = 1, isExpanded = false, onClose }: ProductViewerProps) {
    const controlsRef = useRef<any>(null);
    const [modelState, setModelState] = useState<ModelState>({
        rotation: INITIAL_MODEL_ROTATION,
        position: [0, 0, 0] as [number, number, number],
        scale: [1, 1, 1] as [number, number, number]
    });
    const [loadError, setLoadError] = useState<Error | null>(null);
    const [isServerOffline, setIsServerOffline] = useState(false);

    const [cameraPosition, setCameraPosition] = useState<[number, number, number]>(INITIAL_CAMERA_POSITION);
    const [controlsState, setControlsState] = useState({
        target: INITIAL_TARGET,
        zoom: INITIAL_ZOOM
    });
    const [isAutoRotating, setIsAutoRotating] = useState(isRotating);

    const imageUrl = imagePath ? `https://peyzpnmmgsxjydvpussg.supabase.co/storage/v1/object/public/product-images/${imagePath}` : undefined;

    // Convert relative model path to full URL
    const fullModelUrl = modelUrl ?
        modelUrl.startsWith('http') ?
            modelUrl :
            `https://peyzpnmmgsxjydvpussg.supabase.co/storage/v1/object/public/product-models/${modelUrl}`
        : undefined;

    // Update zoom constants
    const ZOOM_STEP = 1.2;
    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 10;
    const MIN_DISTANCE = 1;  // Reduced from 2
    const MAX_DISTANCE = 50; // Increased from 20

    // Handle zoom in
    const handleZoomIn = () => {
        if (controlsRef.current) {
            const newZoom = controlsState.zoom * ZOOM_STEP;
            setControlsState(prev => ({
                ...prev,
                zoom: Math.min(newZoom, MAX_ZOOM)
            }));
            controlsRef.current.object.zoom = Math.min(newZoom, MAX_ZOOM);
            controlsRef.current.object.updateProjectionMatrix();
        }
    };

    // Handle zoom out
    const handleZoomOut = () => {
        if (controlsRef.current) {
            const newZoom = controlsState.zoom / ZOOM_STEP;
            setControlsState(prev => ({
                ...prev,
                zoom: Math.max(newZoom, MIN_ZOOM)
            }));
            controlsRef.current.object.zoom = Math.max(newZoom, MIN_ZOOM);
            controlsRef.current.object.updateProjectionMatrix();
        }
    };

    // Handle rotation toggle
    const handleRotateToggle = () => {
        setIsAutoRotating(prev => !prev);
    };

    // Sync rotation state with props
    useEffect(() => {
        setIsAutoRotating(isRotating);
    }, [isRotating]);

    // Update controls when rotation state changes
    useEffect(() => {
        if (controlsRef.current) {
            controlsRef.current.autoRotate = isAutoRotating;
        }
    }, [isAutoRotating]);

    useEffect(() => {
        if (controlsRef.current) {
            controlsRef.current.autoRotate = isAutoRotating;
        }
    }, [isAutoRotating]);

    const handleControlsChange = useCallback(() => {
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
    }, []);

    // Convert array to Vector3 for Three.js
    const cameraPositionVector = new Vector3(...cameraPosition);
    const targetVector = new Vector3(...controlsState.target);

    // Update reset function to use initial model rotation
    const handleReset = () => {
        setCameraPosition(INITIAL_CAMERA_POSITION);
        setControlsState({
            target: INITIAL_TARGET,
            zoom: INITIAL_ZOOM
        });

        if (controlsRef.current) {
            controlsRef.current.reset();
            controlsRef.current.object.position.set(...INITIAL_CAMERA_POSITION);
            controlsRef.current.target.set(...INITIAL_TARGET);
            controlsRef.current.object.zoom = INITIAL_ZOOM;
            controlsRef.current.object.updateProjectionMatrix();
            controlsRef.current.update();
        }

        setModelState({
            rotation: INITIAL_MODEL_ROTATION,
            position: [0, 0, 0] as [number, number, number],
            scale: [1, 1, 1] as [number, number, number]
        });
    };

    // Add error handling for the model
    const handleModelError = (error: Error) => {
        setLoadError(error);
        console.error('Model loading error:', error);
    };

    // Add server status check
    useEffect(() => {
        const checkServerStatus = async () => {
            try {
                const response = await fetch('http://localhost:8000/health');
                setIsServerOffline(!response.ok);
            } catch (error) {
                setIsServerOffline(true);
            }
        };

        checkServerStatus();
    }, []);

    const renderCanvas = (expanded: boolean) => (
        <>
            {/* {isServerOffline && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                    <div className="bg-background/80 backdrop-blur-sm p-4 rounded-none border border-border/40 shadow-lg">
                        <p className="text-sm text-muted-foreground">
                            Server is currently offline. 3D preview unavailable.
                        </p>
                    </div>
                </div>
            )} */}
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
                        modelUrl={fullModelUrl}
                        isRotating={isAutoRotating}
                        zoom={zoom}
                        modelState={modelState}
                        onModelStateChange={handleModelStateChange}
                        onError={handleModelError}
                    />
                </Suspense>
                <OrbitControls
                    ref={controlsRef}
                    enableZoom={true}
                    enablePan={true}
                    enableRotate={true}
                    autoRotate={isAutoRotating}
                    autoRotateSpeed={1}
                    onChange={handleControlsChange}
                    target={targetVector}
                    minDistance={MIN_DISTANCE}
                    maxDistance={MAX_DISTANCE}
                    zoomSpeed={1}
                />
            </Canvas>
        </>
    );

    const handleModelStateChange = (newState: ModelState) => {
        setModelState(newState);
    };

    const handleClose = useCallback(() => {
        if (controlsRef.current) {
            handleControlsChange();
        }
        onClose?.();
    }, [handleControlsChange, onClose]);

    // Add a safe handler for expand/close
    const handleExpand = () => {
        onClose?.();
    };

    useEffect(() => {
        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleClose();
            }
        };

        if (isExpanded) {
            document.addEventListener('keydown', handleEscapeKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [isExpanded, handleClose]);

    return (
        <>
            {isExpanded ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={handleClose}>
                    <div className="absolute inset-0 bg-black"></div>
                    <div className="relative w-full h-full max-w-7xl mx-auto cursor-default" onClick={(e) => e.stopPropagation()}>
                        <div className="w-full h-full flex items-center justify-center">
                            {renderCanvas(true)}
                        </div>
                        <div className="absolute top-4 right-4 flex items-center space-x-2">
                            <button
                                className="rounded-none border-2 bg-black/5 dark:bg-white/5 text-gray-800 dark:text-gray-200 hover:bg-black/10 dark:hover:bg-white/10 hover:border-black/20 dark:hover:border-white/20 transition-all duration-200 backdrop-blur-sm px-2 py-1 text-sm focus:outline-none"
                                onClick={handleClose}
                            >
                                ESC
                            </button>
                        </div>
                        <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                            <ProductControls
                                isRotating={isAutoRotating}
                                onRotateToggle={handleRotateToggle}
                                onZoomIn={handleZoomIn}
                                onZoomOut={handleZoomOut}
                                hideExpand
                            />
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