'use client';

import React, { Suspense, useRef, useState, useCallback, memo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Environment, PerspectiveCamera, Html } from '@react-three/drei';
import { EffectComposer, Bloom, SMAA } from '@react-three/postprocessing';
import { Vector3, MOUSE, TOUCH, Box3, BoxGeometry, Mesh, MeshStandardMaterial, Raycaster, Vector2, ACESFilmicToneMapping, Fog, Scene } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry';
import { CADToolbar } from './CADToolbar';
import { XModal } from './XModal';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { LoadingManager } from 'three';
import { toast } from 'react-hot-toast';

// Constants
const INITIAL_CAMERA_POSITION = [10, 10, 10] as const;
const INITIAL_TARGET = [0, 0, 0] as const;
const INITIAL_ZOOM = 1;
const MIN_ZOOM = 0.01;
const MAX_ZOOM = 500;
const MIN_DISTANCE = 0.5;
const MAX_DISTANCE = 1000;

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
    segments: number;
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

interface MeasurementState {
    hoveredFace: number | null;
    dimensions: {
        width: number;
        height: number;
        area: number;
        normal: Vector3;
        point: Vector3;
    } | null;
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
}: CADViewerProps) {
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
    const [measurementState, setMeasurementState] = useState<MeasurementState>({
        hoveredFace: null,
        dimensions: null
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
                    width: 1,
                    height: 1,
                    depth: 1,
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

        // Update scale based on dimensions
        mesh.scale.set(
            Number(parameters.width) ?? 1,
            Number(parameters.height) ?? 1,
            Number(parameters.depth) ?? 1
        );

        // Update material
        if (mesh.material) {
            mesh.material.color.set(parameters.color ? String(parameters.color) : '#D73D57');
            mesh.material.roughness = parameters.roughness ? Number(parameters.roughness) : 0.5;
            mesh.material.metalness = parameters.metalness ? Number(parameters.metalness) : 0;
            mesh.material.opacity = parameters.opacity ? Number(parameters.opacity) : 1;
            mesh.material.transparent = (parameters.opacity ? Number(parameters.opacity) : 1) < 1;
            mesh.material.wireframe = parameters.wireframe ? Boolean(parameters.wireframe) : false;
        }
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
            controlsRef.current.autoRotate = !controlsRef.current.autoRotate;
            controlsRef.current.autoRotateSpeed = 2.0;
            controlsRef.current.update();
        }
    }, [onOperationChange]);

    const handleScale = useCallback(() => {
        if (meshRef.current) {
            const scale = 1.1; // Default scale factor
            const currentScale = meshRef.current.scale.x;
            const newScale = Math.min(100, Math.max(0.1, currentScale * scale));
            meshRef.current.scale.setScalar(newScale);

            // Update parameters based on new scale
            const box = new Box3().setFromObject(meshRef.current);
            const size = box.getSize(new Vector3());

            // Clamp values between 0.1 and 100
            onParameterChange?.('width', Math.min(100, Math.max(0.1, size.x)));
            onParameterChange?.('height', Math.min(100, Math.max(0.1, size.y)));
            onParameterChange?.('depth', Math.min(100, Math.max(0.1, size.z)));
        }
    }, [onParameterChange]);

    const handleMeasure = useCallback(() => {
        onOperationChange?.('measure');
        if (controlsRef.current) {
            controlsRef.current.enableRotate = false;
            controlsRef.current.enablePan = false;
            controlsRef.current.enableZoom = false;
        }
    }, [onOperationChange]);

    const handleMouseMove = useCallback((event: React.MouseEvent) => {
        if (activeOperation !== 'measure' || !meshRef.current) return;

        const canvas = event.currentTarget;
        if (!(canvas instanceof HTMLElement)) return;

        const rect = canvas.getBoundingClientRect();
        mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycasterRef.current.setFromCamera(mouseRef.current, controlsRef.current.object);
        const intersects = raycasterRef.current.intersectObject(meshRef.current);

        const firstIntersect = intersects[0];
        if (firstIntersect?.face) {
            const face = firstIntersect.face;
            const geometry = meshRef.current.geometry;
            const positionAttribute = geometry.getAttribute('position');

            // Get vertices of the intersected face
            const vA = new Vector3();
            const vB = new Vector3();
            const vC = new Vector3();

            vA.fromBufferAttribute(positionAttribute, face.a);
            vB.fromBufferAttribute(positionAttribute, face.b);
            vC.fromBufferAttribute(positionAttribute, face.c);

            // Apply mesh's world matrix to get world coordinates
            const worldMatrix = meshRef.current.matrixWorld;
            vA.applyMatrix4(worldMatrix);
            vB.applyMatrix4(worldMatrix);
            vC.applyMatrix4(worldMatrix);

            // Calculate dimensions
            const width = vA.distanceTo(vB);
            const height = vB.distanceTo(vC);
            const diagonal = vA.distanceTo(vC);

            // Calculate area using Heron's formula
            const s = (width + height + diagonal) / 2;
            const area = Math.sqrt(s * (s - width) * (s - height) * (s - diagonal));

            // Calculate normal vector for orientation
            const normal = face.normal.clone();
            normal.transformDirection(meshRef.current.matrixWorld);

            // Update measurement state
            setMeasurementState({
                hoveredFace: face.a,
                dimensions: {
                    width: width,
                    height: height,
                    area: area,
                    normal: normal,
                    point: firstIntersect.point.clone()
                }
            });

            // Highlight the face
            if (meshRef.current.material) {
                meshRef.current.material.emissive.setHex(0xffff00);
                meshRef.current.material.emissiveIntensity = 0.5;
            }
        } else {
            setMeasurementState({
                hoveredFace: null,
                dimensions: null
            });

            if (meshRef.current.material) {
                meshRef.current.material.emissive.setHex(0x000000);
                meshRef.current.material.emissiveIntensity = 0;
            }
        }
    }, [activeOperation]);

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

    // Enhanced toolbar action handlers
    const handleAutoRotate = useCallback(() => {
        if (controlsRef.current) {
            const newState = !isRotating;
            setIsRotating(newState);
            controlsRef.current.autoRotate = newState;
            controlsRef.current.autoRotateSpeed = 2.0;
            controlsRef.current.update();
        }
    }, [isRotating]);

    const handleZoomIn = useCallback(() => {
        if (controlsRef.current) {
            const zoomScale = 0.9; // Zoom in by reducing the distance
            controlsRef.current.object.position.multiplyScalar(zoomScale);
            controlsRef.current.update();
        }
    }, []);

    const handleZoomOut = useCallback(() => {
        if (controlsRef.current) {
            const zoomScale = 1.1; // Zoom out by increasing the distance
            controlsRef.current.object.position.multiplyScalar(zoomScale);
            controlsRef.current.update();
        }
    }, []);

    const handleZoomModeToggle = useCallback(() => {
        setIsZoomToCursor(!isZoomToCursor);
        if (controlsRef.current) {
            controlsRef.current.mouseButtons.MIDDLE = MOUSE.DOLLY;
            controlsRef.current.touches.TWO = TOUCH.DOLLY_PAN;
            controlsRef.current.zoomToCursor = !isZoomToCursor;
            controlsRef.current.screenSpacePanning = !isZoomToCursor;
            controlsRef.current.update();
        }
    }, [isZoomToCursor]);

    // Update OrbitControls configuration
    useEffect(() => {
        const controls = controlsRef.current;
        if (controls) {
            // Enable all interactions by default
            controls.enableZoom = true;
            controls.enableRotate = true;
            controls.enablePan = true;

            // Enhanced rotation settings
            controls.rotateSpeed = 1.0;
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;

            // Enhanced zoom settings
            controls.zoomSpeed = 1.0;
            controls.mouseButtons.MIDDLE = MOUSE.DOLLY;
            controls.touches.TWO = TOUCH.DOLLY_PAN;
            controls.zoomToCursor = isZoomToCursor;
            controls.minDistance = MIN_DISTANCE;
            controls.maxDistance = MAX_DISTANCE;
            controls.minZoom = MIN_ZOOM;
            controls.maxZoom = MAX_ZOOM;

            // Better touch handling
            controls.touches = {
                ONE: TOUCH.ROTATE,
                TWO: TOUCH.DOLLY_PAN
            };

            // Mouse button mappings
            controls.mouseButtons = {
                LEFT: MOUSE.ROTATE,
                MIDDLE: MOUSE.DOLLY,
                RIGHT: MOUSE.PAN
            };

            // Update and apply settings
            controls.update();
        }
    }, [isZoomToCursor]);

    // Handle wheel events for cursor-based zoom
    useEffect(() => {
        const handleWheel = (event: WheelEvent) => {
            if (!(event.currentTarget instanceof HTMLCanvasElement)) return;
            event.preventDefault();

            if (controlsRef.current && meshRef.current) {
                const delta = -event.deltaY;
                const zoomSpeed = 0.0005;

                if (isZoomToCursor) {
                    const rect = event.currentTarget.getBoundingClientRect();
                    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

                    // Update raycaster
                    raycasterRef.current.setFromCamera(
                        new Vector2(x, y),
                        controlsRef.current.object
                    );

                    // Find intersection point
                    const intersects = raycasterRef.current.intersectObject(meshRef.current);
                    if (intersects.length > 0) {
                        const intersectionPoint = intersects[0].point;
                        const zoomFactor = Math.pow(0.95, delta * zoomSpeed);

                        // Move camera towards intersection point
                        const camera = controlsRef.current.object;
                        const offset = camera.position.clone().sub(intersectionPoint);
                        offset.multiplyScalar(zoomFactor);
                        camera.position.copy(intersectionPoint.clone().add(offset));
                        controlsRef.current.target.copy(intersectionPoint);
                    }
                } else {
                    // Standard zoom
                    const factor = Math.pow(0.95, delta * zoomSpeed);
                    controlsRef.current.object.position.multiplyScalar(factor);
                }

                controlsRef.current.update();
            }
        };

        const canvas = document.querySelector('canvas');
        if (canvas) {
            canvas.addEventListener('wheel', handleWheel);
            return () => canvas.removeEventListener('wheel', handleWheel);
        }
    }, [isZoomToCursor]);

    const handleExpand = useCallback(() => {
        if (meshRef.current && controlsRef.current?.object) {
            // Reset camera to fit object
            const box = new Box3().setFromObject(meshRef.current);
            const center = box.getCenter(new Vector3());
            const size = box.getSize(new Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = controlsRef.current.object.fov * (Math.PI / 180);
            const cameraDistance = maxDim / (2 * Math.tan(fov / 2));

            const controls = controlsRef.current;
            controls.object.position.copy(center);
            controls.object.position.z += cameraDistance * 1.5;
            controls.target.copy(center);
            controls.update();
        }
    }, []);

    // Memoize vectors
    const cameraPositionVector = new Vector3(...cameraState.position);
    const targetVector = new Vector3(...cameraState.target);

    // Enhanced mouse controls with better sensitivity
    useEffect(() => {
        const controls = controlsRef.current;
        if (controls) {
            // Enable all interactions by default
            controls.enableZoom = true;
            controls.enableRotate = true;
            controls.enablePan = true;

            // Enhanced rotation - allow complete vertical rotation
            controls.rotateSpeed = 1.0; // Reduced for more precise control
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.maxPolarAngle = Math.PI * 2; // Allow full vertical rotation
            controls.minPolarAngle = -Math.PI * 2; // Allow full vertical rotation
            controls.maxAzimuthAngle = Infinity; // Allow unlimited horizontal rotation
            controls.minAzimuthAngle = -Infinity;

            // Enhanced zoom
            controls.zoomSpeed = 1.0; // Reduced for more precise control
            controls.mouseButtons.MIDDLE = MOUSE.DOLLY;
            controls.touches.TWO = TOUCH.DOLLY_PAN;

            // Keep object in view
            controls.enableZoomToCursor = true;
            controls.zoomToBoundingBox = true;

            // Enhanced panning
            controls.panSpeed = 1.0; // Reduced for more precise control
            controls.screenSpacePanning = true;

            // Better touch handling
            controls.touches = {
                ONE: TOUCH.ROTATE,
                TWO: TOUCH.DOLLY_PAN
            };

            // Enhanced mouse button mappings
            controls.mouseButtons = {
                LEFT: MOUSE.ROTATE,
                MIDDLE: MOUSE.DOLLY,
                RIGHT: MOUSE.PAN
            };

            // Smooth movement
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;

            // Better touch sensitivity
            controls.touchAngularSpeed = 2.0; // Reduced for more precise control
            controls.touchZoomSpeed = 2.0;
            controls.touchPanSpeed = 2.0;

            // Keep object in view while zooming
            controls.target = new Vector3(0, 0, 0);
            controls.update();
        }
    }, []);

    // Update label positions when cube dimensions change
    useEffect(() => {
        const width = Number(parameters.width) ?? 1;
        const height = Number(parameters.height) ?? 1;
        const depth = Number(parameters.depth) ?? 1;
        const offset = 0.1; // Distance of labels from cube faces

        setMeasurementState({
            hoveredFace: null,
            dimensions: null
        });
    }, [parameters.width, parameters.height, parameters.depth]);

    // Add measurement overlay with FreeCAD-style info
    const MeasurementOverlay = useCallback(() => {
        if (!measurementState.dimensions) return null;

        const { width, height, area, normal, point } = measurementState.dimensions;
        const normalizedNormal = normal.clone().normalize();

        return (
            <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm p-4 rounded-lg border shadow-lg">
                <h3 className="text-sm font-medium mb-2">Face Measurements</h3>
                <div className="space-y-2 text-sm">
                    <div>
                        <p className="font-medium">Dimensions:</p>
                        <p>Length: {width.toFixed(3)} units</p>
                        <p>Width: {height.toFixed(3)} units</p>
                        <p>Area: {area.toFixed(3)} sq units</p>
                    </div>
                    <div>
                        <p className="font-medium">Normal Vector:</p>
                        <p>X: {normalizedNormal.x.toFixed(3)}</p>
                        <p>Y: {normalizedNormal.y.toFixed(3)}</p>
                        <p>Z: {normalizedNormal.z.toFixed(3)}</p>
                    </div>
                    <div>
                        <p className="font-medium">Position:</p>
                        <p>X: {point.x.toFixed(3)}</p>
                        <p>Y: {point.y.toFixed(3)}</p>
                        <p>Z: {point.z.toFixed(3)}</p>
                    </div>
                </div>
            </div>
        );
    }, [measurementState.dimensions]);

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
                    near: 0.1,
                    far: 2000,
                    position: [10, 10, 10]
                }}
                onCreated={({ gl, camera, scene }) => {
                    gl.setClearColor(0x000000, 0);
                    camera.lookAt(0, 0, 0);
                    scene.fog = new Fog(0x000000, 20, 100);
                }}
            >
                <PerspectiveCamera
                    makeDefault
                    position={cameraPositionVector}
                    fov={45}
                    near={0.1}
                    far={1000}
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

                                        // Determine which face we're on based on the intersection point
                                        // We use a small epsilon to handle floating point precision
                                        const epsilon = 0.0001;
                                        let faceIndex;

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

                                        // Create materials array with the hovered face highlighted
                                        const materials = Array(6).fill(null).map((_, i) => {
                                            const mat = new MeshStandardMaterial({
                                                color: parameters.color ? String(parameters.color) : '#D73D57',
                                                roughness: parameters.roughness ? Number(parameters.roughness) : 0.5,
                                                metalness: parameters.metalness ? Number(parameters.metalness) : 0,
                                                transparent: true,
                                                opacity: parameters.opacity ? Number(parameters.opacity) : 1,
                                                wireframe: parameters.wireframe ? Boolean(parameters.wireframe) : false
                                            });
                                            if (i === faceIndex) {
                                                mat.color.set('#00ff00'); // Green highlight
                                                mat.emissive.set('#00ff00');
                                                mat.emissiveIntensity = 0.5;
                                            }
                                            return mat;
                                        });

                                        // Update the mesh materials
                                        e.object.material = materials;

                                        // Calculate face dimensions
                                        const geometry = e.object.geometry;
                                        const positionAttribute = geometry.getAttribute('position');
                                        const face = e.face;

                                        const vA = new Vector3();
                                        const vB = new Vector3();
                                        const vC = new Vector3();

                                        vA.fromBufferAttribute(positionAttribute, face.a);
                                        vB.fromBufferAttribute(positionAttribute, face.b);
                                        vC.fromBufferAttribute(positionAttribute, face.c);

                                        // Apply object's world matrix
                                        vA.applyMatrix4(e.object.matrixWorld);
                                        vB.applyMatrix4(e.object.matrixWorld);
                                        vC.applyMatrix4(e.object.matrixWorld);

                                        const width = vA.distanceTo(vB);
                                        const height = vB.distanceTo(vC);
                                        const area = width * height;

                                        setMeasurementState({
                                            hoveredFace: face.a,
                                            dimensions: {
                                                width,
                                                height,
                                                area,
                                                normal: face.normal,
                                                point: e.point
                                            }
                                        });
                                    }
                                }}
                                onPointerOut={(e) => {
                                    if (e.object instanceof Mesh) {
                                        // Reset to a single material
                                        e.object.material = new MeshStandardMaterial({
                                            color: parameters.color ? String(parameters.color) : '#D73D57',
                                            roughness: parameters.roughness ? Number(parameters.roughness) : 0.5,
                                            metalness: parameters.metalness ? Number(parameters.metalness) : 0,
                                            transparent: true,
                                            opacity: parameters.opacity ? Number(parameters.opacity) : 1,
                                            wireframe: parameters.wireframe ? Boolean(parameters.wireframe) : false
                                        });
                                        setMeasurementState({
                                            hoveredFace: null,
                                            dimensions: null
                                        });
                                    }
                                }}
                                onDoubleClick={(e) => {
                                    // Keep the currently hovered face selected
                                    e.stopPropagation();
                                }}
                            >
                                <boxGeometry args={[1, 1, 1]} />
                                <meshStandardMaterial
                                    color={parameters.color ? String(parameters.color) : '#D73D57'}
                                    roughness={parameters.roughness ? Number(parameters.roughness) : 0.5}
                                    metalness={parameters.metalness ? Number(parameters.metalness) : 0}
                                    transparent
                                    opacity={parameters.opacity ? Number(parameters.opacity) : 1}
                                    wireframe={parameters.wireframe ? Boolean(parameters.wireframe) : false}
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
                    target={targetVector}
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
                    onMove={handleMove}
                    onRotate={handleAutoRotate}
                    onScale={handleScale}
                    onMeasure={handleMeasure}
                    onArray={handleArray}
                    onUnion={handleUnion}
                    onDifference={handleDifference}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onExpand={handleExpand}
                    onZoomModeToggle={handleZoomModeToggle}
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
                    id: '1', // You'll need to pass the actual product ID
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

            {/* Updated Measurement Overlay */}
            {activeOperation === 'measure' && <MeasurementOverlay />}
        </div>
    );
}); 