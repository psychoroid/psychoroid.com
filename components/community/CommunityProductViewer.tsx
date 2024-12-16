'use client';

import React, { Suspense, useRef, useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Product } from '@/components/community/CommunityProduct3D';
import { ModelState } from '@/types/components';
import { Vector3 } from 'three';
import { ProductControls } from '@/components/3D/ProductControls';
import { DownloadModal } from '@/components/community/DownloadModal';
import type { CommunityProduct } from '@/types/community';

// Update initial state constants for centered view
const INITIAL_CAMERA_POSITION: [number, number, number] = [0, 0, 2.5];
const INITIAL_TARGET: [number, number, number] = [0, 0, 0];
const INITIAL_ZOOM = 1.5;
const INITIAL_MODEL_ROTATION: [number, number, number] = [0, 0, 0];
const INITIAL_MODEL_POSITION: [number, number, number] = [0, 0, 0];
const INITIAL_MODEL_SCALE: [number, number, number] = [0.5, 0.5, 0.5];
const ROTATION_SPEED = 1;

interface CommunityProductViewerProps {
    imagePath?: string;
    modelUrl: string;  // Make modelUrl required
    isRotating?: boolean;
    zoom?: number;
    isExpanded?: boolean;
    onClose?: () => void;
}

export function CommunityProductViewer({
    imagePath,
    modelUrl,
    isRotating = true,
    zoom = 1,
    isExpanded = false,
    onClose
}: CommunityProductViewerProps) {
    const controlsRef = useRef<any>(null);
    const [modelState, setModelState] = useState<ModelState>({
        rotation: INITIAL_MODEL_ROTATION,
        position: INITIAL_MODEL_POSITION,
        scale: [1, 1, 1]
    });
    const [cameraPosition, setCameraPosition] = useState<[number, number, number]>(INITIAL_CAMERA_POSITION);
    const [controlsState, setControlsState] = useState({
        target: INITIAL_TARGET,
        zoom: INITIAL_ZOOM
    });
    const [isAutoRotating, setIsAutoRotating] = useState(isRotating);
    const [showDownloadModal, setShowDownloadModal] = useState(false);

    // Process URLs to point to Supabase storage
    const processedModelUrl = !modelUrl
        ? ''
        : modelUrl.startsWith('http')
            ? modelUrl
            : modelUrl.startsWith('default-assets/')
                ? `https://peyzpnmmgsxjydvpussg.supabase.co/storage/v1/object/public/${modelUrl}`
                : `https://peyzpnmmgsxjydvpussg.supabase.co/storage/v1/object/public/product-models/${modelUrl}`;

    const imageUrl = imagePath
        ? `https://peyzpnmmgsxjydvpussg.supabase.co/storage/v1/object/public/product-images/${imagePath}`
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
            position: INITIAL_MODEL_POSITION,
            scale: [1, 1, 1]
        });
    };

    const renderCanvas = (expanded: boolean) => (
        <div className="w-full h-full" style={{ contain: 'strict', isolation: 'isolate' }}>
            <Canvas
                id={`viewer-canvas-${expanded ? 'expanded' : 'normal'}`}
                frameloop="demand"
                gl={{
                    preserveDrawingBuffer: true,
                    alpha: true,
                    antialias: true,
                    failIfMajorPerformanceCaveat: false,
                    powerPreference: 'high-performance'
                }}
                camera={{ position: cameraPositionVector }}
                style={{ width: '100%', height: '100%' }}
            >
                <PerspectiveCamera
                    makeDefault
                    position={cameraPositionVector}
                    zoom={controlsState.zoom}
                />
                <ambientLight intensity={2} />
                <directionalLight position={[5, 5, 5]} intensity={3} castShadow={false} />
                <directionalLight position={[-5, 3, -5]} intensity={1.5} castShadow={false} />
                <directionalLight position={[0, 10, -5]} intensity={1.2} castShadow={false} />
                <hemisphereLight intensity={1} groundColor="white" />
                <Suspense fallback={null}>
                    <Product
                        imageUrl={imageUrl}
                        modelUrl={processedModelUrl}
                        isRotating={isAutoRotating}
                        zoom={zoom}
                        modelState={{
                            ...modelState,
                            position: INITIAL_MODEL_POSITION,
                            scale: INITIAL_MODEL_SCALE
                        }}
                        onModelStateChange={handleModelStateChange}
                        showGrid={false}
                        scale={INITIAL_MODEL_SCALE}
                    />
                </Suspense>
                <OrbitControls
                    ref={controlsRef}
                    enableZoom={true}
                    enablePan={true}
                    enableRotate={true}
                    autoRotate={isAutoRotating}
                    autoRotateSpeed={ROTATION_SPEED}
                    onChange={handleControlsChange}
                    target={new Vector3(...INITIAL_TARGET)}
                    minDistance={0.5}
                    maxDistance={5}
                    zoomSpeed={1}
                    makeDefault
                />
            </Canvas>
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
                    model_path: processedModelUrl,
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