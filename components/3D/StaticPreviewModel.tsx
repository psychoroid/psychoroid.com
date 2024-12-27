'use client';

import React, { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface StaticPreviewModelProps {
    url: string;
    small?: boolean;
    onLoad?: () => void;
}

export function StaticPreviewModel({ url, small = false, onLoad }: StaticPreviewModelProps) {
    const modelRef = useRef<THREE.Group>();
    const { camera } = useThree();

    // Set initial camera position
    useEffect(() => {
        if (camera) {
            camera.position.set(-1.5, 1, 1.5);
            camera.lookAt(0, 0, 0);
        }
    }, [camera]);

    // Load the model
    const { scene } = useGLTF(url);

    // Call onLoad when the scene is ready
    useEffect(() => {
        if (scene && onLoad) {
            onLoad();
        }
    }, [scene, onLoad]);

    if (!scene) return null;

    return (
        <primitive
            ref={modelRef}
            object={scene}
            position={[0, -0.2, 0]}
            rotation={[0, -Math.PI / 4, 0]}
            scale={small ? [0.8, 0.8, 0.8] : [1, 1, 1]}
        />
    );
} 