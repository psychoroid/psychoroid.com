'use client';

import React, { Suspense, useRef, useState, useEffect, useCallback, memo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, SMAA } from '@react-three/postprocessing';
import { Product } from './Product';
import { ProductViewerProps, ModelState } from '@/types/components';
import { Vector3, MOUSE } from 'three';
import { ProductControls } from './ProductControls';
import { DownloadModal } from '@/components/community/DownloadModal';
import type { CommunityProduct } from '@/types/community';
import { ProductCustomization } from './ProductCustomization';
import { supabase } from '@/lib/supabase/supabase';
import SoftwareIntegration from './SoftwareIntegration';

// Constants
const INITIAL_CAMERA_POSITION = [4, 3, 4] as [number, number, number];
const INITIAL_TARGET = [0, 0, 0] as [number, number, number];
const INITIAL_ZOOM = 1;
const ZOOM_STEP = 1.1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 10;
const MIN_DISTANCE = 2;
const MAX_DISTANCE = 20;

interface ExtendedProductViewerProps extends ProductViewerProps {
    product?: CommunityProduct;
}

export const ProductViewer = memo(function ProductViewer({
    imagePath,
    modelUrl,
    isRotating = false,
    zoom = 1,
    isExpanded = false,
    onClose,
    product
}: ExtendedProductViewerProps) {
    const controlsRef = useRef<any>(null);
    const [modelState, setModelState] = useState<ModelState>({
        rotation: [0, 0, 0],
        position: [0, 0, 0],
        scale: [1, 1, 1]
    });
    const [isAutoRotating, setIsAutoRotating] = useState(isRotating);
    const [isZoomToCursor, setIsZoomToCursor] = useState(false);
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [loadedProduct, setLoadedProduct] = useState<CommunityProduct | null>(null);

    // Simplified camera controls
    const [cameraState, setCameraState] = useState({
        position: INITIAL_CAMERA_POSITION,
        target: INITIAL_TARGET,
        zoom: INITIAL_ZOOM
    });

    // Memoize URL construction
    const fullModelUrl = useCallback((path: string | null | undefined) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;

        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!baseUrl) return path;

        return `${baseUrl}/storage/v1/object/public/product-models/${path.replace('product-models/', '')}`;
    }, [])(modelUrl);

    // Fetch product only once when modelUrl changes
    useEffect(() => {
        if (!modelUrl || product || loadedProduct) return;

        const fetchProduct = async () => {
            try {
                const modelPath = modelUrl.includes('product-models/')
                    ? modelUrl.split('product-models/')[1]
                    : modelUrl;

                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .or(`model_path.eq.${modelPath},model_path.eq.product-models/${modelPath}`)
                    .limit(1);

                if (error) throw error;
                if (data?.[0]) setLoadedProduct({ ...data[0], username: '' });
            } catch (error) {
                console.error('Error fetching product:', error);
            }
        };

        fetchProduct();
    }, [modelUrl, product, loadedProduct]);

    // Simplified handlers
    const handleControlsChange = useCallback(() => {
        if (controlsRef.current) {
            const { object, target } = controlsRef.current;
            setCameraState({
                position: [object.position.x, object.position.y, object.position.z],
                target: [target.x, target.y, target.z],
                zoom: object.zoom
            });
        }
    }, []);

    const handleZoom = useCallback((zoomIn: boolean) => {
        if (controlsRef.current) {
            const newZoom = cameraState.zoom * (zoomIn ? ZOOM_STEP : 1 / ZOOM_STEP);
            const clampedZoom = Math.min(Math.max(newZoom, MIN_ZOOM), MAX_ZOOM);

            setCameraState(prev => ({ ...prev, zoom: clampedZoom }));
            controlsRef.current.object.zoom = clampedZoom;
            controlsRef.current.object.updateProjectionMatrix();
        }
    }, [cameraState.zoom]);

    // Current product
    const currentProduct = product || loadedProduct || {
        id: 'temp-id',
        name: 'Untitled Model',
        description: '',
        model_path: modelUrl || '',
        image_path: imagePath || '',
        visibility: 'public' as const,
        likes_count: 0,
        downloads_count: 0,
        views_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: '',
        tags: [],
        username: ''
    };

    // Memoize vectors
    const cameraPositionVector = new Vector3(...cameraState.position);
    const targetVector = new Vector3(...cameraState.target);

    const handleClose = useCallback(() => {
        if (controlsRef.current) handleControlsChange();
        onClose?.();
    }, [handleControlsChange, onClose]);

    useEffect(() => {
        if (!isExpanded) return;

        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') handleClose();
        };

        document.addEventListener('keydown', handleEscapeKey);
        return () => document.removeEventListener('keydown', handleEscapeKey);
    }, [isExpanded, handleClose]);

    const canvasContent = (
        <Canvas
            gl={{
                preserveDrawingBuffer: true,
                alpha: true,
                antialias: false,
                toneMapping: 3,
                toneMappingExposure: 0.8,
                outputColorSpace: "srgb"
            }}
            camera={{
                position: cameraPositionVector,
                fov: 45,
                near: 0.1,
                far: 1000
            }}
            shadows
            className="bg-background dark:bg-background"
        >
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
                            onModelStateChange={setModelState}
                            scale={[1, 1, 1]}
                        />
                    )}
                </Suspense>
            </Stage>

            <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
            <directionalLight position={[-5, 5, -5]} intensity={0.5} castShadow />
            <spotLight position={[10, 10, 5]} angle={0.15} penumbra={1} intensity={0.6} castShadow />
            <ambientLight intensity={0.2} />
            <Environment preset="warehouse" background={false} blur={0.8} />

            <EffectComposer multisampling={0}>
                <Bloom intensity={0.2} luminanceThreshold={1.0} luminanceSmoothing={0.6} />
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
    );

    return (
        <>
            {isExpanded ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-8" onClick={handleClose}>
                    <div className="absolute inset-0 bg-black bg-opacity-80" />
                    <div className="relative w-full h-[500px] max-w-2xl mx-auto cursor-default bg-background border border-border rounded-none shadow-lg p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="w-full h-full flex flex-col">
                            <div className="flex-1 relative">
                                {fullModelUrl && <SoftwareIntegration modelUrl={fullModelUrl} />}
                                {canvasContent}
                                <div className="absolute right-[19px] top-1/2 transform -translate-y-1/2">
                                    <ProductControls
                                        isRotating={isAutoRotating}
                                        onRotateToggle={() => setIsAutoRotating(prev => !prev)}
                                        onZoomIn={() => handleZoom(true)}
                                        onZoomOut={() => handleZoom(false)}
                                        onDownload={() => setShowDownloadModal(true)}
                                        hideExpand
                                        isZoomToCursor={isZoomToCursor}
                                        onZoomModeToggle={() => setIsZoomToCursor(prev => !prev)}
                                    />
                                </div>
                            </div>
                            <ProductCustomization product={currentProduct} />
                        </div>
                        <button
                            className="absolute top-2 right-3 rounded-none border-2 bg-black/5 dark:bg-white/5 text-gray-800 dark:text-gray-200 hover:bg-black/10 dark:hover:bg-white/10 hover:border-black/20 dark:hover:border-white/20 transition-all duration-200 backdrop-blur-sm px-2 py-1 text-sm focus:outline-none"
                            onClick={handleClose}
                        >
                            ESC
                        </button>
                    </div>
                </div>
            ) : (
                <div className="h-full w-full rounded-lg">
                    <div className="relative w-full h-full flex flex-col">
                        <div className="flex-1 relative">
                            {fullModelUrl && <SoftwareIntegration modelUrl={fullModelUrl} />}
                            {canvasContent}
                            <div className="absolute right-[19px] top-1/2 transform -translate-y-1/2">
                                <ProductControls
                                    isRotating={isAutoRotating}
                                    onRotateToggle={() => setIsAutoRotating(prev => !prev)}
                                    onZoomIn={() => handleZoom(true)}
                                    onZoomOut={() => handleZoom(false)}
                                    onDownload={() => setShowDownloadModal(true)}
                                    hideExpand
                                    isZoomToCursor={isZoomToCursor}
                                    onZoomModeToggle={() => setIsZoomToCursor(prev => !prev)}
                                />
                            </div>
                        </div>
                        <ProductCustomization product={currentProduct} />
                    </div>
                </div>
            )}

            <DownloadModal
                isOpen={showDownloadModal}
                onClose={() => setShowDownloadModal(false)}
                product={currentProduct}
                onDownload={() => setShowDownloadModal(false)}
            />
        </>
    );
});