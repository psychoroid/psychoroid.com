'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Mesh, Box3, Vector3, GridHelper, Group } from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { ProductProps } from '@/types/community';

// Define the GLTF result type
type GLTFResult = GLTF & {
    nodes: { [key: string]: THREE.Mesh };
    materials: { [key: string]: THREE.Material };
};

const INITIAL_ROTATION: [number, number, number] = [0, 0, 0];
const ROTATION_SPEED = 0.8;

export function Product({
    imageUrl,
    modelUrl,
    isRotating = true,
    zoom = 1,
    modelState,
    onModelStateChange,
    onLoad,
    onError,
    scale = [1, 1, 1],
    onProgress,
    showGrid = true
}: ProductProps): JSX.Element {
    const containerRef = useRef<Group>(null);
    const meshRef = useRef<Mesh>(null);
    const gridRef = useRef<GridHelper>(null);

    const model = useLoader(
        GLTFLoader,
        modelUrl || '',
        (event) => {
            if (event instanceof ProgressEvent) {
                const progress = (event.loaded / event.total) * 100;
                onProgress?.(progress);
            }
        },
        (error) => {
            if (!(error instanceof ProgressEvent)) {
                console.error('Error loading model:', error);
                onError?.(error);
            }
        }
    ) as GLTFResult;

    useEffect(() => {
        if (!modelUrl || !model || !containerRef.current) return;

        try {
            // 1. Reset everything
            model.scene.traverse((child) => {
                if (child instanceof Mesh) {
                    child.position.set(0, 0, 0);
                    child.rotation.set(0, 0, 0);
                    child.scale.set(1, 1, 1);
                }
            });
            model.scene.position.set(0, 0, 0);
            model.scene.rotation.set(0, 0, 0);
            model.scene.scale.set(1, 1, 1);
            containerRef.current.position.set(0, 0, 0);
            containerRef.current.rotation.set(0, 0, 0);
            containerRef.current.scale.set(1, 1, 1);

            // 2. Get initial bounds
            const box = new Box3().setFromObject(model.scene);
            const size = box.getSize(new Vector3());
            const center = box.getCenter(new Vector3());

            // 3. Calculate scale
            const maxDimension = Math.max(size.x, size.y, size.z);
            const normalizedScale = 1 / maxDimension;

            // 4. Center the model
            model.scene.position.x = -center.x;
            model.scene.position.y = -center.y; // Center vertically
            model.scene.position.z = -center.z;

            // 5. Apply scale to container
            containerRef.current.scale.set(
                normalizedScale * scale[0],
                normalizedScale * scale[1],
                normalizedScale * scale[2]
            );

            // 6. Set initial rotation
            containerRef.current.rotation.set(INITIAL_ROTATION[0], INITIAL_ROTATION[1], INITIAL_ROTATION[2]);

            onModelStateChange?.({
                rotation: INITIAL_ROTATION,
                position: [0, 0, 0],
                scale: [normalizedScale, normalizedScale, normalizedScale]
            });

            onLoad?.();
        } catch (error) {
            console.error('Error setting up model:', error);
            onError?.(error);
        }
    }, [model, modelUrl, onModelStateChange, onLoad, onError, scale]);

    useFrame((state, delta) => {
        if (!containerRef.current) return;

        if (isRotating) {
            containerRef.current.rotation.y += delta * ROTATION_SPEED;
            onModelStateChange?.({
                rotation: [
                    containerRef.current.rotation.x,
                    containerRef.current.rotation.y,
                    containerRef.current.rotation.z
                ],
                position: model.scene.position.toArray() as [number, number, number],
                scale: containerRef.current.scale.toArray() as [number, number, number]
            });
        }

        // Update container scale for zoom
        containerRef.current.scale.set(
            zoom * scale[0],
            zoom * scale[1],
            zoom * scale[2]
        );

        if (gridRef.current) {
            const gridScale = zoom;
            gridRef.current.scale.set(gridScale, gridScale, gridScale);
        }
    });

    return (
        <>
            {showGrid && (
                <gridHelper
                    ref={gridRef}
                    args={[2, 10, "#67B7D1", "#67B7D1"]}
                    position={[0, 0, 0]}
                    rotation={[0, 0, 0]}
                />
            )}
            <group ref={containerRef}>
                <primitive object={model.scene} />
            </group>
        </>
    );
}