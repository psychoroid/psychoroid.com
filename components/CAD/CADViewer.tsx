'use client';

import React, { Suspense, useRef, useState, useCallback, memo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Environment, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, SMAA } from '@react-three/postprocessing';
import { Vector3, MOUSE, TOUCH, Box3, BoxGeometry, Mesh, MeshStandardMaterial, Raycaster, Vector2, Face3, SRGBColorSpace, ACESFilmicToneMapping, Fog } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry';
import { CADToolbar } from './CADToolbar';
import { XModal } from './XModal';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
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
    const [meshData, setMeshData] = useState<MeshData | null>(null);
    const [scene, setScene] = useState<THREE.Scene | null>(null);
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

    // Load mesh data when modelUrl changes
    useEffect(() => {
        if (modelUrl) {
            console.log('CADViewer: Loading model from URL:', modelUrl.substring(0, 100) + '...')

            try {
                // Set up loaders with LoadingManager for better error handling
                const manager = new LoadingManager()
                manager.onError = (url) => {
                    console.error('CADViewer: Failed to load resource:', url)
                    toast.error('Failed to load model resource')
                }

                const loader = new GLTFLoader(manager)
                loader.setCrossOrigin('anonymous')

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

                    // Load the model from the Blob URL
                    loader.load(
                        blobUrl,
                        (gltf) => {
                            console.log('CADViewer: Model loaded successfully', {
                                scenes: gltf.scenes.length,
                                animations: gltf.animations.length,
                                materials: Object.keys(gltf.materials || {}).length,
                                hasScene: !!gltf.scene
                            })

                            if (!gltf.scene) {
                                throw new Error('No scene in loaded model')
                            }

                            // Calculate bounding box
                            const box = new Box3().setFromObject(gltf.scene)
                            const center = box.getCenter(new Vector3())
                            const size = box.getSize(new Vector3())

                            // Calculate scale to normalize model size
                            const maxDimension = Math.max(size.x, size.y, size.z)
                            const targetScale = 3 / maxDimension

                            // Center the model
                            gltf.scene.position.set(-center.x, -center.y, -center.z)
                            gltf.scene.scale.setScalar(targetScale)

                            // Update materials for better rendering
                            gltf.scene.traverse((child) => {
                                if (child instanceof Mesh) {
                                    if (child.material) {
                                        child.material.needsUpdate = true
                                        child.castShadow = true
                                        child.receiveShadow = true
                                    }
                                }
                            })

                            // Set the scene
                            setScene(gltf.scene)

                            // Clean up
                            URL.revokeObjectURL(blobUrl)
                        },
                        (progress) => {
                            const percent = progress.total ? Math.round((progress.loaded / progress.total) * 100) : 0
                            console.log('CADViewer: Loading progress:', percent + '%')
                        },
                        (error) => {
                            console.error('CADViewer: Error loading model:', error)
                            toast.error('Failed to load 3D model')
                            setScene(null)
                            URL.revokeObjectURL(blobUrl)
                        }
                    )
                } else {
                    // Handle regular URLs
                    loader.load(
                        modelUrl,
                        (gltf) => {
                            console.log('CADViewer: Model loaded successfully', {
                                scenes: gltf.scenes.length,
                                animations: gltf.animations.length,
                                materials: Object.keys(gltf.materials || {}).length,
                                hasScene: !!gltf.scene
                            })

                            if (!gltf.scene) {
                                throw new Error('No scene in loaded model')
                            }

                            const box = new Box3().setFromObject(gltf.scene)
                            const center = box.getCenter(new Vector3())
                            const size = box.getSize(new Vector3())
                            const maxDimension = Math.max(size.x, size.y, size.z)
                            const targetScale = 3 / maxDimension

                            gltf.scene.position.set(-center.x, -center.y, -center.z)
                            gltf.scene.scale.setScalar(targetScale)

                            gltf.scene.traverse((child) => {
                                if (child instanceof Mesh) {
                                    if (child.material) {
                                        child.material.needsUpdate = true
                                        child.castShadow = true
                                        child.receiveShadow = true
                                    }
                                }
                            })

                            setScene(gltf.scene)
                        },
                        (progress) => {
                            const percent = progress.total ? Math.round((progress.loaded / progress.total) * 100) : 0
                            console.log('CADViewer: Loading progress:', percent + '%')
                        },
                        (error) => {
                            console.error('CADViewer: Error loading model:', error)
                            toast.error('Failed to load 3D model')
                            setScene(null)
                        }
                    )
                }
            } catch (error) {
                console.error('CADViewer: Failed to load model:', error)
                toast.error('Failed to initialize model loader')
                setScene(null)
            }
        }
    }, [modelUrl]);

    // Update mesh when parameters change
    useEffect(() => {
        const mesh = meshRef.current;
        if (!mesh || !parameters) return;

        console.log('CADViewer: Updating mesh parameters', parameters)

        // Clamp parameters between 0.1 and 100
        const clampedParams: ClampedParameters = {
            width: Math.min(100, Math.max(0.1, Number(parameters.width) ?? 1)),
            height: Math.min(100, Math.max(0.1, Number(parameters.height) ?? 1)),
            depth: Math.min(100, Math.max(0.1, Number(parameters.depth) ?? 1)),
            radius: Math.min(
                Math.min(
                    Number(parameters.width) ?? 1,
                    Math.min(Number(parameters.height) ?? 1, Number(parameters.depth) ?? 1)
                ) / 2,
                Math.max(0, Number(parameters.radius) ?? 0)
            ),
            segments: Math.min(32, Math.max(2, Math.floor(Number(parameters.segments) ?? 4))),
            rotation: {
                x: Number(parameters.rotationX) ?? 0,
                y: Number(parameters.rotationY) ?? 0,
                z: Number(parameters.rotationZ) ?? 0
            },
            position: {
                x: Number(parameters.positionX) ?? 0,
                y: Number(parameters.positionY) ?? 0,
                z: Number(parameters.positionZ) ?? 0
            },
            scale: {
                x: Number(parameters.scaleX) ?? 1,
                y: Number(parameters.scaleY) ?? 1,
                z: Number(parameters.scaleZ) ?? 1
            },
            material: {
                color: String(parameters.color ?? '#ffffff'),
                roughness: Math.min(1, Math.max(0, Number(parameters.roughness) ?? 0.5)),
                metalness: Math.min(1, Math.max(0, Number(parameters.metalness) ?? 0)),
                opacity: Math.min(1, Math.max(0, Number(parameters.opacity) ?? 1)),
                wireframe: Boolean(parameters.wireframe ?? false)
            }
        };

        if (!modelUrl) {
            // For the default cube
            if (mesh.geometry) {
                mesh.geometry.dispose();
            }

            // Use RoundedBoxGeometry when radius > 0, otherwise use regular BoxGeometry
            if (clampedParams.radius > 0) {
                // Calculate radius as a percentage of the smallest dimension
                const minDimension = Math.min(
                    clampedParams.width,
                    Math.min(clampedParams.height, clampedParams.depth)
                );
                const effectiveRadius = (clampedParams.radius / 100) * minDimension;

                mesh.geometry = new RoundedBoxGeometry(
                    clampedParams.width,
                    clampedParams.height,
                    clampedParams.depth,
                    Math.max(1, Math.floor(clampedParams.segments / 2)),
                    effectiveRadius
                );
            } else {
                mesh.geometry = new BoxGeometry(
                    clampedParams.width,
                    clampedParams.height,
                    clampedParams.depth,
                    Math.max(1, Math.floor(clampedParams.segments / 2)),
                    Math.max(1, Math.floor(clampedParams.segments / 2)),
                    Math.max(1, Math.floor(clampedParams.segments / 2))
                );
            }

            // Update material
            if (mesh.material) {
                mesh.material.color.set(clampedParams.material.color);
                mesh.material.roughness = clampedParams.material.roughness;
                mesh.material.metalness = clampedParams.material.metalness;
                mesh.material.opacity = clampedParams.material.opacity;
                mesh.material.transparent = clampedParams.material.opacity < 1;
                mesh.material.wireframe = clampedParams.material.wireframe;
            }

            // Update transform
            mesh.rotation.set(
                clampedParams.rotation.x * Math.PI / 180,
                clampedParams.rotation.y * Math.PI / 180,
                clampedParams.rotation.z * Math.PI / 180
            );
            mesh.position.set(
                clampedParams.position.x,
                clampedParams.position.y,
                clampedParams.position.z
            );
        } else {
            // For loaded models
            const box = new Box3().setFromObject(mesh);
            const size = box.getSize(new Vector3());

            // Calculate incremental scale changes
            const scaleX = clampedParams.width / size.x;
            const scaleY = clampedParams.height / size.y;
            const scaleZ = clampedParams.depth / size.z;

            if (isMeshWithScale(mesh)) {
                mesh.scale.set(scaleX, scaleY, scaleZ);
            }
        }
    }, [parameters, modelUrl]);

    // Initialize default parameters with reasonable values
    useEffect(() => {
        if (!isInitialized && !modelUrl) {
            setIsInitialized(true);
            requestAnimationFrame(() => {
                updateParameters({
                    width: 1,
                    height: 1,
                    depth: 1,
                    radius: 0
                });
            });
        }
    }, [isInitialized, modelUrl, updateParameters]);

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
        const rect = canvas.getBoundingClientRect();

        mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycasterRef.current.setFromCamera(mouseRef.current, controlsRef.current.object);
        const intersects = raycasterRef.current.intersectObject(meshRef.current);

        if (intersects.length > 0) {
            const intersection = intersects[0];
            const face = intersection.face;
            if (!face) return;

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
            const normal = intersection.face.normal.clone();
            normal.transformDirection(meshRef.current.matrixWorld);

            // Update measurement state
            setMeasurementState({
                hoveredFace: face.a,
                dimensions: {
                    width: width,
                    height: height,
                    area: area,
                    normal: normal,
                    point: intersection.point.clone()
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

            // Reset face highlight
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
            event.preventDefault();
            if (controlsRef.current && meshRef.current) {
                const delta = -event.deltaY;
                const zoomSpeed = 0.0005;

                if (isZoomToCursor) {
                    // Get mouse position in normalized device coordinates
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
            canvas.addEventListener('wheel', handleWheel, { passive: false });
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
                    intensity={0.5}
                    environment="city"
                    adjustCamera={false}
                    shadows={true}
                    preset="rembrandt"
                >
                    <Suspense fallback={null}>
                        {scene ? (
                            <primitive object={scene} />
                        ) : meshData ? (
                            <mesh ref={meshRef}>
                                <bufferGeometry>
                                    <bufferAttribute
                                        attach="attributes-position"
                                        count={meshData.vertices.length / 3}
                                        array={meshData.vertices}
                                        itemSize={3}
                                    />
                                    {meshData.indices && (
                                        <bufferAttribute
                                            attach="index"
                                            count={meshData.indices.length}
                                            array={meshData.indices}
                                            itemSize={1}
                                        />
                                    )}
                                    {meshData.normals && (
                                        <bufferAttribute
                                            attach="attributes-normal"
                                            count={meshData.normals.length / 3}
                                            array={meshData.normals}
                                            itemSize={3}
                                        />
                                    )}
                                    {meshData.uvs && (
                                        <bufferAttribute
                                            attach="attributes-uv"
                                            count={meshData.uvs.length / 2}
                                            array={meshData.uvs}
                                            itemSize={2}
                                        />
                                    )}
                                </bufferGeometry>
                                <meshStandardMaterial
                                    color={parameters.color ?? '#ffffff'}
                                    roughness={parameters.roughness ?? 0.5}
                                    metalness={parameters.metalness ?? 0}
                                    transparent
                                    opacity={parameters.opacity ?? 1}
                                    wireframe={parameters.wireframe ?? false}
                                />
                            </mesh>
                        ) : null}
                    </Suspense>
                </Stage>

                <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow shadow-mapSize={[2048, 2048]} />
                <directionalLight position={[-5, 5, -5]} intensity={0.5} castShadow shadow-mapSize={[2048, 2048]} />
                <spotLight position={[10, 10, 5]} angle={0.15} penumbra={1} intensity={0.6} castShadow shadow-mapSize={[2048, 2048]} />
                <ambientLight intensity={0.3} />
                <Environment preset="city" background={false} blur={0.8} />

                <EffectComposer multisampling={4}>
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
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
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