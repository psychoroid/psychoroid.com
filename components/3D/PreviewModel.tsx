'use client';

import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Mesh, Box3, Vector3 } from 'three';

interface PreviewModelProps {
    url: string;
    small?: boolean;
    onLoad?: () => void;
    onError?: (error: Error) => void;
    gridView?: boolean;
}

export function PreviewModel({ url, small = false, onLoad, onError, gridView = false }: PreviewModelProps) {
    const meshRef = useRef<Mesh>(null);
    const { scene } = useGLTF(url);
    const initializedRef = useRef(false);

    // Handle model initialization and scaling
    useEffect(() => {
        if (scene && meshRef.current && !initializedRef.current) {
            try {
                const box = new Box3().setFromObject(scene);
                const size = box.getSize(new Vector3());
                const maxDimension = Math.max(size.x, size.y, size.z);

                // Fixed scales for different views
                const GRID_SCALE = 1.6;
                const SMALL_SCALE = 1.2;
                const DEFAULT_SCALE = 1.4;

                const finalScale = (1 / maxDimension) * (
                    gridView ? GRID_SCALE :
                        small ? SMALL_SCALE :
                            DEFAULT_SCALE
                );

                meshRef.current.scale.setScalar(finalScale);

                // Center the model
                const center = box.getCenter(new Vector3());
                const yOffset = gridView ? -0.1 : small ? 0 : -0.05;
                meshRef.current.position.set(
                    0,
                    (-center.y * finalScale) + yOffset,
                    0
                );

                // Set initial rotation
                const isDefaultModel = url.includes('default-assets');
                if (!isDefaultModel) {
                    meshRef.current.rotation.y = Math.PI;
                }

                initializedRef.current = true;
                onLoad?.();
            } catch (error) {
                onError?.(error instanceof Error ? error : new Error('Failed to initialize model'));
            }
        }
    }, [scene, small, gridView, url, onLoad, onError]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            initializedRef.current = false;
            if (url) {
                useGLTF.preload(url);
            }
        };
    }, [url]);

    // Smooth rotation
    useFrame((state, delta) => {
        if (meshRef.current && initializedRef.current) {
            meshRef.current.rotation.y += delta * 0.5;
        }
    });

    return (
        <mesh ref={meshRef}>
            <primitive object={scene} />
        </mesh>
    );
} 