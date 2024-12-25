'use client';

import React, { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Mesh, Box3, Vector3 } from 'three';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

interface PreviewModelProps {
    url: string;
    small?: boolean;
    onLoad?: () => void;
    gridView?: boolean;
}

export function PreviewModel({ url, small, onLoad, gridView }: PreviewModelProps) {
    const meshRef = useRef<Mesh>(null);
    const model = useLoader(GLTFLoader, url);
    const scaleRef = useRef<number | null>(null);
    const initializedRef = useRef(false);

    React.useEffect(() => {
        if (model && meshRef.current && !initializedRef.current) {
            const box = new Box3().setFromObject(model.scene);
            const size = box.getSize(new Vector3());
            const maxDimension = Math.max(size.x, size.y, size.z);

            // Fixed scales for different views
            const GRID_SCALE = 1.6;
            const SMALL_SCALE = 1.2;
            const DEFAULT_SCALE = 1.4;

            // Use exact values for each view type
            const finalScale = (1 / maxDimension) * (
                gridView ? GRID_SCALE :
                    small ? SMALL_SCALE :
                        DEFAULT_SCALE
            );

            scaleRef.current = finalScale;
            meshRef.current.scale.setScalar(finalScale);

            // Fixed positions for different views
            const center = box.getCenter(new Vector3());
            const GRID_Y_OFFSET = -0.1;
            const SMALL_Y_OFFSET = 0;
            const DEFAULT_Y_OFFSET = -0.05;

            const yOffset = gridView ? GRID_Y_OFFSET :
                small ? SMALL_Y_OFFSET :
                    DEFAULT_Y_OFFSET;

            meshRef.current.position.set(
                0,
                (-center.y * finalScale) + yOffset,
                0
            );

            // Set initial rotation based on model source
            const isDefaultModel = url.includes('default-assets');
            if (!isDefaultModel) {
                meshRef.current.rotation.y = Math.PI; // 180 degrees for non-default models
            }

            initializedRef.current = true;
            onLoad?.();
        }
    }, [model, small, onLoad, gridView, url]);

    // Use fixed rotation speed
    useFrame((state, delta) => {
        if (meshRef.current) {
            const ROTATION_SPEED = 0.15; // Use consistent speed for all models
            meshRef.current.rotation.y += delta * ROTATION_SPEED;
        }
    });

    return (
        <mesh ref={meshRef}>
            <primitive object={model.scene} />
        </mesh>
    );
} 