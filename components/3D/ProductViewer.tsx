'use client';

import React, { Suspense, useRef, useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stage, Environment, ContactShadows, AccumulativeShadows, RandomizedLight } from '@react-three/drei';
import { EffectComposer, Bloom, SMAA } from '@react-three/postprocessing';
import { Product } from './Product';
import { ProductViewerProps, ModelState } from '@/types/components';
import { Vector3, MOUSE, WebGLRenderer } from 'three';
import { ProductControls } from './ProductControls';
import { DownloadModal } from '@/components/community/DownloadModal';
import type { CommunityProduct } from '@/types/community';
import { ProductCustomization } from './ProductCustomization';
import { supabase } from '@/lib/supabase/supabase';
import SoftwareIntegration from './SoftwareIntegration';

// Update initial state constants for better front view
const ANGLE = Math.PI * (45 / 180); // 45 degrees for a better isometric view
const DISTANCE = 6; // Fixed distance for consistent view
const INITIAL_CAMERA_POSITION: [number, number, number] = [
    DISTANCE * Math.cos(ANGLE), // X position
    DISTANCE * 0.5, // Y position at half height
    DISTANCE * Math.sin(ANGLE)  // Z position
];
const INITIAL_TARGET: [number, number, number] = [0, 0, 0];
const INITIAL_ZOOM = 1;

// Add initial model rotation to face forward
const INITIAL_MODEL_ROTATION: [number, number, number] = [0, 0, 0];

// Update the ProductViewerProps interface
interface ExtendedProductViewerProps extends ProductViewerProps {
    product?: CommunityProduct;
}

export function ProductViewer({ imagePath, modelUrl, isRotating = false, zoom = 1, isExpanded = false, onClose, product }: ExtendedProductViewerProps) {
    const controlsRef = useRef<any>(null);
    const [modelState, setModelState] = useState<ModelState>({
        rotation: INITIAL_MODEL_ROTATION,
        position: [0, 0, 0] as [number, number, number],
        scale: [1, 1, 1] as [number, number, number]
    });
    const [loadError, setLoadError] = useState<Error | null>(null);
    // const [isServerOffline, setIsServerOffline] = useState(false);

    const [cameraPosition, setCameraPosition] = useState<[number, number, number]>(INITIAL_CAMERA_POSITION);
    const [controlsState, setControlsState] = useState({
        target: INITIAL_TARGET,
        zoom: INITIAL_ZOOM
    });
    const [isAutoRotating, setIsAutoRotating] = useState(false);
    const [isZoomToCursor, setIsZoomToCursor] = useState(false);

    // Construct URLs with proper handling
    const getStorageUrl = (path: string, type: 'image' | 'model') => {
        if (!path) return undefined;
        if (path.startsWith('http')) return path;

        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!baseUrl) return path;

        // Extract UUID and filename if present
        const uuidMatch = path.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
        const uuid = uuidMatch ? uuidMatch[1] : null;

        if (uuid && path.includes('_generated-')) {
            // For generated images, keep them in the product-models bucket with their UUID folder
            return `${baseUrl}/storage/v1/object/public/product-models/${uuid}/${path.split('/').pop()}`;
        }

        // For regular assets
        const bucket = type === 'image' ? 'product-images' : 'product-models';
        const cleanPath = path.replace(`${bucket}/`, '').replace(/^\//, '');
        return `${baseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`;
    };

    const imageUrl = imagePath ? getStorageUrl(imagePath, 'image') : undefined;
    const fullModelUrl = modelUrl ? getStorageUrl(modelUrl, 'model') : undefined;

    // Update zoom constants
    const ZOOM_STEP = 1.1; // Reduced for finer control
    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 10;
    const MIN_DISTANCE = 2;  // Increased minimum distance
    const MAX_DISTANCE = 20; // Reduced maximum distance

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

    // Update controls when rotation state changes
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

    // // Add server status check
    // useEffect(() => {
    //     const checkServerStatus = async () => {
    //         try {
    //             const response = await fetch('http://localhost:8000/health');
    //             setIsServerOffline(!response.ok);
    //         } catch (error) {
    //             setIsServerOffline(true);
    //         }
    //     };

    //     checkServerStatus();
    // }, []);

    const [showDownloadModal, setShowDownloadModal] = useState(false);

    // Handle zoom mode toggle
    const handleZoomModeToggle = () => {
        setIsZoomToCursor(prev => !prev);
    };

    const renderCanvas = (expanded: boolean) => (
        <div className="relative w-full h-full">
            {fullModelUrl && <SoftwareIntegration modelUrl={fullModelUrl} />}

            <Canvas
                gl={{
                    preserveDrawingBuffer: true,
                    alpha: true,
                    antialias: false, // Disabled because we're using SMAA
                    toneMapping: 3, // ACESFilmicToneMapping
                    toneMappingExposure: 0.8, // Reduced from 1.5 for better handling of bright objects
                    outputColorSpace: "srgb"
                }}
                camera={{
                    position: cameraPositionVector,
                    fov: 45,
                    near: 0.1,
                    far: 1000
                }}
                shadows
                style={{ width: '100%', height: '100%' }}
                className="bg-background dark:bg-background"
                id="main-product-viewer"
            >
                {/* Enhanced lighting setup */}
                <Stage
                    intensity={0.8}
                    environment="warehouse"
                    adjustCamera={false}
                    shadows={false}
                    preset="rembrandt"
                >
                    <Suspense fallback={null}>
                        {fullModelUrl && (
                            <Product
                                modelUrl={fullModelUrl}
                                isRotating={isAutoRotating}
                                zoom={zoom}
                                modelState={modelState}
                                onModelStateChange={handleModelStateChange}
                                scale={[1, 1, 1]}
                            />
                        )}
                    </Suspense>
                </Stage>

                {/* Improved lighting setup for better details */}
                <directionalLight
                    position={[5, 5, 5]}
                    intensity={0.8}
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                    shadow-bias={-0.0001}
                />
                <directionalLight
                    position={[-5, 5, -5]}
                    intensity={0.5}
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                    shadow-bias={-0.0001}
                />
                <spotLight
                    position={[10, 10, 5]}
                    angle={0.15}
                    penumbra={1}
                    intensity={0.6}
                    castShadow
                    shadow-bias={-0.0001}
                />
                <ambientLight intensity={0.2} />

                {/* Enhanced environment and effects */}
                <Environment
                    preset="warehouse"
                    background={false}
                    blur={0.8}
                />
                {/* Enhanced environment and effects */}
                <EffectComposer multisampling={0}>
                    <Bloom
                        intensity={0.2}
                        luminanceThreshold={1.0}
                        luminanceSmoothing={0.6}
                    />
                    <SMAA />
                </EffectComposer>

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
                    zoomSpeed={1.5}
                    maxPolarAngle={Math.PI / 1.5}
                    minPolarAngle={Math.PI / 6}
                    rotateSpeed={0.8}
                    mouseButtons={{
                        LEFT: MOUSE.ROTATE,
                        MIDDLE: MOUSE.DOLLY,
                        RIGHT: MOUSE.PAN
                    }}
                    screenSpacePanning={true}
                    enableDamping={true}
                    dampingFactor={0.05}
                    zoomToCursor={isZoomToCursor}
                />
            </Canvas>
            <div className="absolute right-[19px] top-1/2 transform -translate-y-1/2">
                <ProductControls
                    isRotating={isAutoRotating}
                    onRotateToggle={handleRotateToggle}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onDownload={() => setShowDownloadModal(true)}
                    hideExpand
                    isZoomToCursor={isZoomToCursor}
                    onZoomModeToggle={handleZoomModeToggle}
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

    const [loadedProduct, setLoadedProduct] = useState<CommunityProduct | null>(null);

    // Fetch product by model_path if no product is provided
    useEffect(() => {
        const fetchProductByModelPath = async () => {
            if (!modelUrl || product) return;

            try {
                // Extract the model path from the full URL
                const modelPath = modelUrl.includes('product-models/')
                    ? modelUrl.split('product-models/')[1]
                    : modelUrl;

                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('model_path', modelPath)
                    .single();

                if (error) throw error;

                if (data) {
                    setLoadedProduct({
                        ...data,
                        username: '' // We might want to fetch this separately if needed
                    });
                }
            } catch (error) {
                console.error('Error fetching product:', error);
                // Fallback to default product if fetch fails
                setLoadedProduct({
                    id: 'temp-id',
                    name: 'Untitled Model',
                    description: '',
                    model_path: modelUrl || '',
                    image_path: imagePath || '',
                    visibility: 'public',
                    likes_count: 0,
                    downloads_count: 0,
                    views_count: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    user_id: '',
                    tags: [],
                    username: ''
                });
            }
        };

        fetchProductByModelPath();
    }, [modelUrl, product, imagePath]);

    // Use the loaded product or the provided product or fallback to default
    const currentProduct = product || loadedProduct || {
        id: 'temp-id',
        name: 'Untitled Model',
        description: '',
        model_path: modelUrl || '',
        image_path: imagePath || '',
        visibility: 'public',
        likes_count: 0,
        downloads_count: 0,
        views_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: '',
        tags: [],
        username: ''
    };

    return (
        <>
            {isExpanded ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-8" onClick={handleClose}>
                    <div className="absolute inset-0 bg-black bg-opacity-80"></div>
                    <div className="relative w-full h-[500px] max-w-2xl mx-auto cursor-default bg-background border border-border rounded-none shadow-lg p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="w-full h-full flex flex-col">
                            <div className="flex-1">
                                {renderCanvas(true)}
                            </div>
                            <ProductCustomization product={currentProduct} />
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
                    <div className="relative w-full h-full flex flex-col">
                        <div className="flex-1">
                            {renderCanvas(false)}
                        </div>
                        <ProductCustomization product={currentProduct} />
                    </div>
                </div>
            )}

            <DownloadModal
                isOpen={showDownloadModal}
                onClose={() => setShowDownloadModal(false)}
                product={product || {
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