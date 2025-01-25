'use client';

import React, { Suspense, useRef, useState, useCallback, memo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Environment, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, SMAA } from '@react-three/postprocessing';
import { Vector3, MOUSE, Box3 } from 'three';
import { CADToolbar } from './CADToolbar';

// Constants
const INITIAL_CAMERA_POSITION = [10, 10, 10] as [number, number, number];
const INITIAL_TARGET = [0, 0, 0] as [number, number, number];
const INITIAL_ZOOM = 1;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 50;
const MIN_DISTANCE = 1;
const MAX_DISTANCE = 100;

interface CADViewerProps {
    modelUrl: string | null;
    parameters?: Record<string, number>;
    onParameterChange?: (name: string, value: number) => void;
    onExport?: () => void;
    onShare?: () => void;
    activeOperation?: string;
    onOperationChange?: (operation: string | null) => void;
}

export const CADViewer = memo(function CADViewer({
    modelUrl,
    parameters,
    onParameterChange = () => console.log('Parameter change not implemented'),
    onExport = () => console.log('Export not implemented'),
    onShare = () => console.log('Share not implemented'),
    activeOperation,
    onOperationChange
}: CADViewerProps) {
    const controlsRef = useRef<any>(null);
    const meshRef = useRef<THREE.Mesh>(null);
    const [cameraState, setCameraState] = useState({
        position: INITIAL_CAMERA_POSITION,
        target: INITIAL_TARGET,
        zoom: INITIAL_ZOOM
    });

    // Update mesh when parameters change
    useEffect(() => {
        if (meshRef.current && parameters) {
            const geometry = meshRef.current.geometry;
            const box = new Box3().setFromObject(meshRef.current);
            const size = box.getSize(new Vector3());

            // Update scale based on parameters
            if (parameters.width) meshRef.current.scale.x = parameters.width / size.x;
            if (parameters.height) meshRef.current.scale.y = parameters.height / size.y;
            if (parameters.depth) meshRef.current.scale.z = parameters.depth / size.z;

            // Update parameters based on current scale
            onParameterChange('width', meshRef.current.scale.x * size.x);
            onParameterChange('height', meshRef.current.scale.y * size.y);
            onParameterChange('depth', meshRef.current.scale.z * size.z);
        }
    }, [parameters, onParameterChange]);

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

    // Toolbar action handlers
    const handleMove = useCallback(() => {
        onOperationChange?.('move');
        if (controlsRef.current) {
            controlsRef.current.enablePan = true;
            controlsRef.current.enableRotate = false;
        }
    }, [onOperationChange]);

    const handleRotate = useCallback(() => {
        onOperationChange?.('rotate');
        if (controlsRef.current) {
            controlsRef.current.enablePan = false;
            controlsRef.current.enableRotate = true;
        }
    }, [onOperationChange]);

    const handleScale = useCallback((scale: number) => {
        onOperationChange?.('scale');
        if (meshRef.current) {
            const newScale = meshRef.current.scale.x * scale;
            meshRef.current.scale.setScalar(newScale);

            // Update parameters based on new scale
            const box = new Box3().setFromObject(meshRef.current);
            const size = box.getSize(new Vector3());
            onParameterChange('width', size.x);
            onParameterChange('height', size.y);
            onParameterChange('depth', size.z);
        }
    }, [onOperationChange, onParameterChange]);

    const handleMeasure = useCallback(() => {
        onOperationChange?.('measure');
        // TODO: Implement measurement tool
        console.log('Measure tool activated');
    }, [onOperationChange]);

    const handleArray = useCallback(() => {
        onOperationChange?.('array');
        // TODO: Implement array tool
        console.log('Array tool activated');
    }, [onOperationChange]);

    const handleUnion = useCallback(() => {
        onOperationChange?.('union');
        // TODO: Implement boolean union
        console.log('Union operation activated');
    }, [onOperationChange]);

    const handleDifference = useCallback(() => {
        onOperationChange?.('difference');
        // TODO: Implement boolean difference
        console.log('Difference operation activated');
    }, [onOperationChange]);

    // Memoize vectors
    const cameraPositionVector = new Vector3(...cameraState.position);
    const targetVector = new Vector3(...cameraState.target);

    return (
        <div className="relative w-full h-full">
            <Canvas
                gl={{
                    preserveDrawingBuffer: true,
                    alpha: true,
                    antialias: true,
                    logarithmicDepthBuffer: true
                }}
                shadows
                className="bg-background"
            >
                <PerspectiveCamera
                    makeDefault
                    position={cameraPositionVector}
                    fov={45}
                    near={0.1}
                    far={1000}
                />

                <Stage
                    intensity={0.5}
                    environment="city"
                    adjustCamera={false}
                    shadows={true}
                    preset="rembrandt"
                >
                    <Suspense fallback={null}>
                        {modelUrl ? (
                            <mesh ref={meshRef}>
                                {/* Add your 3D model loading logic here */}
                                <boxGeometry args={[
                                    parameters?.width || 1,
                                    parameters?.height || 1,
                                    parameters?.depth || 1
                                ]} />
                                <meshStandardMaterial
                                    color="#666"
                                    transparent
                                    opacity={activeOperation === 'measure' ? 0.7 : 1}
                                />
                            </mesh>
                        ) : (
                            <mesh ref={meshRef}>
                                <boxGeometry args={[1, 1, 1]} />
                                <meshStandardMaterial
                                    color="#666"
                                    transparent
                                    opacity={activeOperation === 'measure' ? 0.7 : 1}
                                />
                            </mesh>
                        )}
                    </Suspense>
                </Stage>

                <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
                <directionalLight position={[-5, 5, -5]} intensity={0.5} castShadow />
                <spotLight position={[10, 10, 5]} angle={0.15} penumbra={1} intensity={0.6} castShadow />
                <ambientLight intensity={0.2} />
                <Environment preset="city" background={false} blur={0.8} />

                <EffectComposer multisampling={4}>
                    <Bloom intensity={0.2} luminanceThreshold={1.0} luminanceSmoothing={0.6} />
                    <SMAA />
                </EffectComposer>

                <OrbitControls
                    ref={controlsRef}
                    enableZoom={true}
                    enablePan={activeOperation === 'move'}
                    enableRotate={activeOperation === 'rotate' || !activeOperation}
                    onChange={handleControlsChange}
                    target={targetVector}
                    minDistance={MIN_DISTANCE}
                    maxDistance={MAX_DISTANCE}
                    maxZoom={MAX_ZOOM}
                    minZoom={MIN_ZOOM}
                    zoomSpeed={1}
                    panSpeed={1}
                    rotateSpeed={0.8}
                    mouseButtons={{
                        LEFT: MOUSE.ROTATE,
                        MIDDLE: MOUSE.DOLLY,
                        RIGHT: MOUSE.PAN
                    }}
                    screenSpacePanning={true}
                    enableDamping={true}
                    dampingFactor={0.05}
                />
            </Canvas>

            {/* CAD Toolbar */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <CADToolbar
                    onExport={onExport}
                    onShare={onShare}
                    onMove={handleMove}
                    onRotate={handleRotate}
                    onScale={() => handleScale(1.1)}
                    onMeasure={handleMeasure}
                    onArray={handleArray}
                    onUnion={handleUnion}
                    onDifference={handleDifference}
                    activeOperation={activeOperation}
                />
            </div>

            {/* Active Operation Indicator */}
            {activeOperation && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-background/80 backdrop-blur-sm rounded-lg border shadow-lg">
                    <span className="text-sm font-medium capitalize">{activeOperation} Mode</span>
                </div>
            )}
        </div>
    );
}); 