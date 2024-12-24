'use client';

import React, { Suspense, useRef, useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Product } from './Product';
import { ProductViewerProps, ModelState } from '@/types/components';
import { Vector3 } from 'three';
import { ProductControls } from './ProductControls';
import { DownloadModal } from '@/components/community/DownloadModal';
import type { CommunityProduct } from '@/types/community';

// Update initial state constants for better front view
const ANGLE = Math.PI * (90 / 180); // Convert 40 degrees to radians
const DISTANCE = Math.sqrt(30); // Distance from origin (4 * sqrt(2))
const INITIAL_CAMERA_POSITION: [number, number, number] = [
    DISTANCE * Math.cos(ANGLE), // X position
    4, // Y position stays the same
    DISTANCE * Math.sin(ANGLE)  // Z position
];
const INITIAL_TARGET: [number, number, number] = [0, 0, 0];
const INITIAL_ZOOM = 1;

// Add initial model rotation to face forward
const INITIAL_MODEL_ROTATION: [number, number, number] = [0, Math.PI, 0];

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

    const [showDownloadModal, setShowDownloadModal] = useState(false);

    const renderCanvas = (expanded: boolean) => (
        <div className="relative w-full h-full">
            <Canvas
                gl={{
                    preserveDrawingBuffer: true,
                    alpha: true
                }}
                camera={{ position: cameraPositionVector }}
                style={{ width: '100%', height: '100%' }}
                className="bg-slate-300/90 dark:bg-zinc-900/50"
            >
                <ambientLight intensity={0.4} />
                <directionalLight position={[5, 5, 5]} intensity={0.3} castShadow />
                <directionalLight position={[-5, 5, -5]} intensity={0.2} castShadow />
                <hemisphereLight
                    intensity={0.2}
                    groundColor="rgb(5 5 5)"
                    color="#fafafa"
                />

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
                    autoRotate={false}
                    autoRotateSpeed={0}
                    onChange={handleControlsChange}
                    target={targetVector}
                    minDistance={MIN_DISTANCE}
                    maxDistance={MAX_DISTANCE}
                    zoomSpeed={1}
                    maxPolarAngle={Math.PI / 1.5}
                    minPolarAngle={Math.PI / 6}
                />
            </Canvas>
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <ProductControls
                    isRotating={isAutoRotating}
                    onRotateToggle={handleRotateToggle}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onDownload={() => setShowDownloadModal(true)}
                    hideExpand
                />
            </div>
        </div>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-8" onClick={handleClose}>
                    <div className="absolute inset-0 bg-black bg-opacity-80"></div>
                    <div className="relative w-full h-[500px] max-w-2xl mx-auto cursor-default bg-background border border-border rounded-none shadow-lg p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="w-full h-full flex items-center justify-center">
                            {renderCanvas(true)}
                        </div>
                        <div className="absolute top-2 right-3 flex items-center space-x-2">
                            <button
                                className="rounded-none border-2 bg-black/5 dark:bg-white/5 text-gray-800 dark:text-gray-200 hover:bg-black/10 dark:hover:bg-white/10 hover:border-black/20 dark:hover:border-white/20 transition-all duration-200 backdrop-blur-sm px-2 py-1 text-sm focus:outline-none"
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

            <DownloadModal
                isOpen={showDownloadModal}
                onClose={() => setShowDownloadModal(false)}
                product={{
                    id: 'temp-id',
                    name: 'Model',
                    description: 'Temporary model preview',
                    model_path: fullModelUrl || '',
                    image_path: imageUrl || '',
                    visibility: 'public',
                    likes_count: 0,
                    downloads_count: 0,
                    views_count: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    user_id: '',
                    tags: [],
                    username: ''
                } as CommunityProduct}
                onDownload={() => {
                    setShowDownloadModal(false);
                }}
            />
        </>
    );
}