'use client';

import React, { Suspense, useRef, useState, useEffect } from 'react';
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

    const [cameraPosition, setCameraPosition] = useState<[number, number, number]>(INITIAL_CAMERA_POSITION);
    const [controlsState, setControlsState] = useState({
        target: INITIAL_TARGET,
        zoom: INITIAL_ZOOM
    });
    const [isAutoRotating, setIsAutoRotating] = useState(isRotating);

    const imageUrl = imagePath ? `https://peyzpnmmgsxjydvpussg.supabase.co/storage/v1/object/public/product-images/${imagePath}` : undefined;

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
                    isRotating={isAutoRotating}
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
                autoRotate={isAutoRotating}
                autoRotateSpeed={1}
                onChange={handleControlsChange}
                target={targetVector}
                minDistance={MIN_DISTANCE}
                maxDistance={MAX_DISTANCE}
                zoomSpeed={1}
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

    // Add a safe handler for expand/close
    const handleExpand = () => {
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
                        <ProductControls
                            isRotating={isAutoRotating}
                            onRotateToggle={handleRotateToggle}
                            onZoomIn={handleZoomIn}
                            onZoomOut={handleZoomOut}
                            hideExpand
                        />
                    </div>
                </div>
            ) : (
                <div className="h-full w-full rounded-lg">
                    {renderCanvas(false)}
                    <ProductControls
                        isRotating={isAutoRotating}
                        onRotateToggle={handleRotateToggle}
                        onZoomIn={handleZoomIn}
                        onZoomOut={handleZoomOut}
                        onExpand={handleExpand}
                    />
                </div>
            )}
        </>
    );
}