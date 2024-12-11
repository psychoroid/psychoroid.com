'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei';
import { Suspense, useRef, useState, useEffect } from 'react';
import { Vector3 } from 'three';

const MODEL_URLS = [
    process.env.NEXT_PUBLIC_LANDING_MODEL_URL_1,
    process.env.NEXT_PUBLIC_LANDING_MODEL_URL_2,
    process.env.NEXT_PUBLIC_LANDING_MODEL_URL_3,
    process.env.NEXT_PUBLIC_LANDING_MODEL_URL_4,
    process.env.NEXT_PUBLIC_LANDING_MODEL_URL_5,
].filter(Boolean) as string[];

// Preload all models
MODEL_URLS.forEach(url => useGLTF.preload(url));

const INITIAL_CAMERA_POSITION: [number, number, number] = [0, 2, 5];
const INITIAL_TARGET: [number, number, number] = [0, 0, 0];
const INITIAL_ZOOM = 1.5;
const INITIAL_MODEL_ROTATION: [number, number, number] = [0, Math.PI, 0];
const ROTATION_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

function Model({ url }: { url: string }) {
    const { scene } = useGLTF(url);
    return <primitive object={scene} scale={1} position={[0, 0, 0]} rotation={INITIAL_MODEL_ROTATION} />;
}

export function LandingViewer() {
    const controlsRef = useRef<any>(null);
    const [isAutoRotating, setIsAutoRotating] = useState(true);
    const [cameraPosition, setCameraPosition] = useState<[number, number, number]>(INITIAL_CAMERA_POSITION);
    const [controlsState, setControlsState] = useState({
        target: INITIAL_TARGET,
        zoom: INITIAL_ZOOM
    });

    // Get current model based on time
    const [currentModelUrl, setCurrentModelUrl] = useState(MODEL_URLS[0]);

    useEffect(() => {
        // Function to update the current model
        const updateModel = () => {
            const now = Date.now();
            const hoursElapsed = Math.floor(now / ROTATION_INTERVAL);
            const modelIndex = hoursElapsed % MODEL_URLS.length;
            setCurrentModelUrl(MODEL_URLS[modelIndex]);
        };

        // Update immediately
        updateModel();

        // Calculate time until next change
        const now = Date.now();
        const timeUntilNextChange = ROTATION_INTERVAL - (now % ROTATION_INTERVAL);

        // Set up interval for future updates
        const initialTimeout = setTimeout(() => {
            updateModel();
            // After the initial timeout, set up regular interval
            const interval = setInterval(updateModel, ROTATION_INTERVAL);
            return () => clearInterval(interval);
        }, timeUntilNextChange);

        return () => clearTimeout(initialTimeout);
    }, []);

    const cameraPositionVector = new Vector3(...cameraPosition);
    const targetVector = new Vector3(...controlsState.target);

    return (
        <div className="w-full h-full">
            <Canvas
                gl={{ preserveDrawingBuffer: true }}
                camera={{ position: cameraPositionVector }}
                style={{ background: 'transparent' }}
            >
                <PerspectiveCamera
                    makeDefault
                    position={cameraPositionVector}
                    zoom={controlsState.zoom}
                />
                <ambientLight intensity={2} />
                <directionalLight position={[5, 5, 5]} intensity={3} castShadow />
                <directionalLight position={[-5, 3, -5]} intensity={1.5} />
                <directionalLight position={[0, 10, -5]} intensity={1.2} />
                <hemisphereLight intensity={1} groundColor="white" />
                <Suspense>
                    <Model url={currentModelUrl} />
                </Suspense>
                <OrbitControls
                    ref={controlsRef}
                    enableZoom={true}
                    enablePan={true}
                    enableRotate={true}
                    autoRotate={isAutoRotating}
                    autoRotateSpeed={1}
                    target={targetVector}
                    minDistance={1}
                    maxDistance={50}
                    zoomSpeed={1}
                />
            </Canvas>
        </div>
    );
} 