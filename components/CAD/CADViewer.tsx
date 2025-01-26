'use client';

import React, { Suspense, useRef, useState, useCallback, memo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Environment, PerspectiveCamera, Html } from '@react-three/drei';
import { EffectComposer, Bloom, SMAA } from '@react-three/postprocessing';
import { Vector3, MOUSE, TOUCH, Box3, BoxGeometry, Mesh, MeshStandardMaterial, Raycaster, Vector2, ACESFilmicToneMapping, Fog, Scene, DoubleSide, Color } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry';
import { CADToolbar } from './CADToolbar';
import { XModal } from './XModal';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { LoadingManager } from 'three';
import { toast } from 'react-hot-toast';

// Constants
const INITIAL_CAMERA_POSITION = [50, 50, 50] as const;
const INITIAL_TARGET = [0, 0, 0] as const;
const INITIAL_ZOOM = 1;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 100;
const MIN_DISTANCE = 20;
const MAX_DISTANCE = 500;

// Type definitions
interface CADViewerProps {
    modelUrl: string | null;
    parameters?: Record<string, number | string | boolean>;
    onParameterChange?: (name: string, value: number | string | boolean) => void;
    onExport?: () => void;
    onShare?: () => void;
    activeOperation?: string;
    onOperationChange?: (operation: string | null) => void;
}

interface MeshData {
    vertices: number[];
    indices: number[];
    normals: number[];
    uvs: number[];
}

interface CameraState {
    position: typeof INITIAL_CAMERA_POSITION;
    target: typeof INITIAL_TARGET;
    zoom: number;
}

interface ClampedParameters {
    width: number;
    height: number;
    depth: number;
    radius: number;
    rotation: { x: number; y: number; z: number };
    position: { x: number; y: number; z: number };
    scale: { x: number; y: number; z: number };
    material: {
        color: string;
        roughness: number;
        metalness: number;
        opacity: number;
        wireframe: boolean;
    };
}

// Type guard for mesh with scale
function isMeshWithScale(mesh: Mesh | null): mesh is Mesh & { scale: Vector3 } {
    return mesh !== null && mesh.scale instanceof Vector3;
}

export const CADViewer = memo(function CADViewer({
    modelUrl,
    parameters = {},
    onParameterChange,
    onExport = () => console.log('Export not implemented'),
    onShare = () => console.log('Share not implemented'),
    activeOperation,
    onOperationChange
}: CADViewerProps): JSX.Element {
    const controlsRef = useRef<any>(null);
    const meshRef = useRef<Mesh<BoxGeometry | RoundedBoxGeometry, MeshStandardMaterial>>(null);
    const [scene, setScene] = useState<Scene | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isRotating, setIsRotating] = useState(false);
    const [isZoomToCursor, setIsZoomToCursor] = useState(false);
    const [cameraState, setCameraState] = useState<CameraState>({
        position: INITIAL_CAMERA_POSITION,
        target: INITIAL_TARGET,
        zoom: INITIAL_ZOOM
    });
    const raycasterRef = useRef(new Raycaster());
    const mouseRef = useRef(new Vector2());
    const [isModalOpen, setIsModalOpen] = useState(false);

    const updateParameters = useCallback((updates: Record<string, number | string | boolean>) => {
        if (onParameterChange) {
            Object.entries(updates).forEach(([name, value]) => {
                onParameterChange(name, value);
            });
        }
    }, [onParameterChange]);

    // Initialize default parameters
    useEffect(() => {
        if (!isInitialized && !modelUrl) {
            setIsInitialized(true);
            requestAnimationFrame(() => {
                updateParameters({
                    width: 10,
                    height: 10,
                    depth: 10,
                    color: '#D73D57',
                    roughness: 0.5,
                    metalness: 0,
                    opacity: 1
                });
            });
        }
    }, [isInitialized, modelUrl, updateParameters]);

    // Update mesh when parameters change
    useEffect(() => {
        const mesh = meshRef.current;
        if (!mesh || !parameters) return;

        // Convert mm to scene units (1 scene unit = 1mm)
        const width = Number(parameters.width) ?? 10;
        const height = Number(parameters.height) ?? 10;
        const depth = Number(parameters.depth) ?? 10;
        const radiusPercent = Number(parameters.radius) ?? 0; // Now treated as percentage (0-100)
        const SEGMENTS = 32; // Fixed high segment count for best quality

        // Dispose of old geometry
        if (mesh.geometry) {
            mesh.geometry.dispose();
        }

        // Create new geometry based on radius
        if (radiusPercent > 0) {
            // Calculate max possible radius (half of smallest dimension)
            const maxRadius = Math.min(width, Math.min(height, depth)) / 2;
            // Convert percentage to actual radius
            const effectiveRadius = (radiusPercent / 100) * maxRadius;

            mesh.geometry = new RoundedBoxGeometry(
                width,
                height,
                depth,
                SEGMENTS, // Fixed high segment count
                effectiveRadius
            );
        } else {
            mesh.geometry = new BoxGeometry(
                width,
                height,
                depth,
                SEGMENTS, // Fixed high segment count
                SEGMENTS,
                SEGMENTS
            );
        }

        // Update material
        if (mesh.material) {
            // Base color only
            mesh.material.color.set(parameters.color ? String(parameters.color) : '#D73D57');

            // Wireframe implementation (levels 0-5, where 0 is normal cube)
            const wireframeLevel = Math.min(5, Math.max(0, Math.round(Number(parameters.wireframe) || 0)));
            mesh.material.wireframe = wireframeLevel > 0;

            // Adjust geometry based on wireframe level
            if (mesh.geometry) {
                mesh.geometry.dispose();

                const segmentCount = wireframeLevel === 0 ? 1 : 8 + ((wireframeLevel - 1) * 6);

                if (radiusPercent > 0) {
                    // Calculate max possible radius (half of smallest dimension)
                    const maxRadius = Math.min(width, Math.min(height, depth)) / 2;
                    // Convert percentage to actual radius
                    const effectiveRadius = (radiusPercent / 100) * maxRadius;

                    mesh.geometry = new RoundedBoxGeometry(
                        width,
                        height,
                        depth,
                        segmentCount,
                        effectiveRadius
                    );
                } else {
                    mesh.geometry = new BoxGeometry(
                        width,
                        height,
                        depth,
                        segmentCount,
                        segmentCount,
                        segmentCount
                    );
                }
            }

            // Basic quality settings
            mesh.material.needsUpdate = true;
            mesh.material.side = DoubleSide;
        }

        // Reset scale since we're using actual dimensions in geometry
        mesh.scale.set(1, 1, 1);
    }, [parameters]);

    // Load mesh data when modelUrl changes
    useEffect(() => {
        if (modelUrl) {
            console.log('CADViewer: Loading model from URL:', modelUrl.substring(0, 100) + '...')

            try {
                const manager = new LoadingManager()
                manager.onError = (url) => {
                    console.error('CADViewer: Failed to load resource:', url)
                    toast.error('Failed to load model resource')
                }

                const loader = new GLTFLoader(manager)
                loader.setCrossOrigin('anonymous')

                const loadModel = async (url: string) => {
                    try {
                        const gltf = await loader.loadAsync(url);

                        if (!gltf.scene) {
                            throw new Error('No scene in loaded model')
                        }

                        const newScene = new Scene();
                        const gltfScene = gltf.scene.clone();
                        newScene.add(gltfScene);

                        const box = new Box3().setFromObject(gltfScene);
                        const center = box.getCenter(new Vector3());
                        const size = box.getSize(new Vector3());
                        const maxDimension = Math.max(size.x, size.y, size.z);
                        const targetScale = 3 / maxDimension;

                        gltfScene.position.set(-center.x, -center.y, -center.z);
                        gltfScene.scale.setScalar(targetScale);

                        gltfScene.traverse((child) => {
                            if (child instanceof Mesh) {
                                if (child.material) {
                                    child.material.needsUpdate = true;
                                    child.castShadow = true;
                                    child.receiveShadow = true;
                                }
                            }
                        });

                        setScene(newScene);
                    } catch (error) {
                        console.error('CADViewer: Error loading model:', error)
                        toast.error('Failed to load 3D model')
                        setScene(null)
                    }
                };

                // If it's a data URL, convert it to a Blob URL
                if (modelUrl.startsWith('data:')) {
                    const base64Data = modelUrl.split(',')[1]
                    const binaryString = atob(base64Data)
                    const bytes = new Uint8Array(binaryString.length)
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i)
                    }
                    const blob = new Blob([bytes.buffer], { type: 'model/gltf-binary' })
                    const blobUrl = URL.createObjectURL(blob)

                    loadModel(blobUrl).finally(() => {
                        URL.revokeObjectURL(blobUrl)
                    });
                } else {
                    loadModel(modelUrl);
                }
            } catch (error) {
                console.error('CADViewer: Failed to load model:', error)
                toast.error('Failed to initialize model loader')
                setScene(null)
            }
        }
    }, [modelUrl]);

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
    const handleZoomModeToggle = useCallback(() => {
        setIsZoomToCursor(!isZoomToCursor);
    }, [isZoomToCursor]);

    const handleAutoRotate = useCallback(() => {
        if (controlsRef.current) {
            const newState = !isRotating;
            setIsRotating(newState);
            controlsRef.current.autoRotate = newState;
            controlsRef.current.autoRotateSpeed = 2.0;
            controlsRef.current.update();
        }
    }, [isRotating]);

    // Update the export handler
    const handleExport = useCallback(() => {
        setIsModalOpen(true);
    }, []);

    return (
        <div className="relative w-full h-full">
            <Canvas
                gl={{
                    preserveDrawingBuffer: true,
                    alpha: true,
                    antialias: false,
                    toneMapping: ACESFilmicToneMapping,
                    toneMappingExposure: 0.8,
                    outputColorSpace: "srgb"
                }}
                shadows
                dpr={[1, 2]}
                className="bg-background"
                camera={{
                    fov: 45,
                    near: 1,
                    far: 2000,
                    position: [50, 50, 50]
                }}
                onCreated={({ gl, camera, scene }) => {
                    gl.setClearColor(0x000000, 0);
                    camera.lookAt(0, 0, 0);
                    scene.fog = new Fog(0x000000, 200, 1000);
                }}
            >
                <PerspectiveCamera
                    makeDefault
                    position={cameraState.position}
                    fov={45}
                    near={1}
                    far={2000}
                />

                <Stage
                    intensity={0.8}
                    environment="warehouse"
                    adjustCamera={false}
                    shadows={false}
                    preset="rembrandt"
                >
                    <Suspense fallback={null}>
                        {scene ? (
                            <primitive object={scene} />
                        ) : (
                            <mesh
                                ref={meshRef}
                                onPointerMove={(e) => {
                                    e.stopPropagation();
                                    if (e.face && e.object instanceof Mesh && typeof e.faceIndex === 'number') {
                                        // Get the intersection point in local coordinates
                                        const localPoint = e.point.clone().applyMatrix4(e.object.matrixWorld.invert());

                                        // Get current radius percentage from parameters
                                        const radiusPercent = Number(parameters.radius) || 0;

                                        // Determine which face we're on based on the intersection point
                                        let faceIndex;

                                        // For high radius values (near sphere), treat as a single face
                                        if (radiusPercent > 90) {
                                            faceIndex = 0; // Single face for near-spherical shapes
                                        } else {
                                            // Check which face we're closest to
                                            const absX = Math.abs(localPoint.x);
                                            const absY = Math.abs(localPoint.y);
                                            const absZ = Math.abs(localPoint.z);

                                            if (absX > absY && absX > absZ) {
                                                faceIndex = localPoint.x > 0 ? 0 : 1; // Right/Left
                                            } else if (absY > absX && absY > absZ) {
                                                faceIndex = localPoint.y > 0 ? 2 : 3; // Top/Bottom
                                            } else {
                                                faceIndex = localPoint.z > 0 ? 4 : 5; // Front/Back
                                            }
                                        }

                                        // Create materials array with the hovered face highlighted
                                        const materials = Array(6).fill(null).map((_, i) => {
                                            const mat = new MeshStandardMaterial({
                                                color: parameters.color ? String(parameters.color) : '#D73D57',
                                                wireframe: parameters.wireframe ? Number(parameters.wireframe) > 0 : false
                                            });
                                            if (i === faceIndex) {
                                                mat.color.set('#161B2A');
                                                mat.emissive.set('#161B2A');
                                                mat.emissiveIntensity = 0.3;
                                            }
                                            return mat;
                                        });

                                        // Update the mesh materials
                                        e.object.material = materials;
                                    }
                                }}
                                onPointerOut={(e) => {
                                    if (e.object instanceof Mesh) {
                                        // Reset to a single material with original color
                                        e.object.material = new MeshStandardMaterial({
                                            color: parameters.color ? String(parameters.color) : '#D73D57',
                                            wireframe: parameters.wireframe ? Number(parameters.wireframe) > 0 : false
                                        });
                                    }
                                }}
                                onDoubleClick={(e) => {
                                    // Keep the currently hovered face selected
                                    e.stopPropagation();
                                }}
                            >
                                <boxGeometry args={[10, 10, 10, 32, 32, 32]} />
                                <meshStandardMaterial
                                    color={parameters.color ? String(parameters.color) : '#D73D57'}
                                    wireframe={parameters.wireframe ? Number(parameters.wireframe) > 0 : false}
                                />
                            </mesh>
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
                    makeDefault
                    enableZoom={true}
                    enablePan={true}
                    enableRotate={true}
                    onChange={handleControlsChange}
                    target={cameraState.target}
                    minDistance={MIN_DISTANCE}
                    maxDistance={MAX_DISTANCE}
                    maxZoom={MAX_ZOOM}
                    minZoom={MIN_ZOOM}
                    zoomSpeed={2.0}
                    panSpeed={2.0}
                    rotateSpeed={2.0}
                    mouseButtons={{
                        LEFT: MOUSE.ROTATE,
                        MIDDLE: MOUSE.DOLLY,
                        RIGHT: MOUSE.PAN
                    }}
                    touches={{
                        ONE: TOUCH.ROTATE,
                        TWO: TOUCH.DOLLY_PAN
                    }}
                    screenSpacePanning={true}
                    enableDamping={true}
                    dampingFactor={0.05}
                    autoRotate={isRotating}
                    autoRotateSpeed={2.0}
                />
            </Canvas>

            {/* Enhanced CAD Toolbar */}
            <div className="absolute right-4 top-[60%] -translate-y-1/2">
                <CADToolbar
                    onExport={handleExport}
                    onZoomModeToggle={handleZoomModeToggle}
                    onAutoRotate={handleAutoRotate}
                    isRotating={isRotating}
                    isZoomToCursor={isZoomToCursor}
                    activeOperation={activeOperation}
                />
            </div>

            {/* XModal for Export and Share */}
            <XModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={{
                    id: '1',
                    name: 'CAD Model',
                    model_path: modelUrl || ''
                }}
                onDownload={(id) => {
                    console.log('Downloaded model:', id);
                    setIsModalOpen(false);
                }}
            />

            {/* Active Operation Indicator */}
            {activeOperation && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-background/80 backdrop-blur-sm rounded-lg border shadow-lg">
                    <span className="text-sm font-medium capitalize">{activeOperation} Mode</span>
                </div>
            )}

            {/* Gesture Guide Overlay - shows briefly when control mode changes */}
            {activeOperation && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-background/80 backdrop-blur-sm rounded-lg border shadow-lg opacity-0 animate-fade-in-out">
                    <span className="text-sm font-medium">
                        {activeOperation === 'move' && "Pan: Two finger drag or right-click drag"}
                        {activeOperation === 'rotate' && "Rotate: One finger drag or left-click drag"}
                        {activeOperation === 'scale' && "Scale: Pinch gesture or mouse wheel"}
                    </span>
                </div>
            )}
        </div>
    );
}); 