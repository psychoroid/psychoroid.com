'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Mesh, TextureLoader, Box3, Vector3, GridHelper } from 'three';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { ProductProps } from '@/types/components';

// Define initial rotation to show front view
const INITIAL_ROTATION: [number, number, number] = [0, Math.PI, 0]; // Rotate 180 degrees around Y axis

export function Product({ imageUrl, modelUrl, isRotating = true, zoom = 1, modelState, onModelStateChange }: ProductProps) {
  const meshRef = useRef<Mesh>(null);
  const gridRef = useRef<GridHelper>(null);
  const model = modelUrl ? useLoader(GLTFLoader, modelUrl) : null;
  const [modelHeight, setModelHeight] = useState(0);

  // Effect for initial model setup
  useEffect(() => {
    if (model && meshRef.current) {
      const box = new Box3().setFromObject(model.scene);
      const size = box.getSize(new Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z);
      const scale = 1 / maxDimension;
      meshRef.current.scale.set(scale, scale, scale);

      // Set initial rotation to show front view
      meshRef.current.rotation.set(INITIAL_ROTATION[0], INITIAL_ROTATION[1], INITIAL_ROTATION[2]);

      // Calculate the actual height of the scaled model
      const scaledHeight = size.y * scale;
      setModelHeight(scaledHeight);

      onModelStateChange?.({
        rotation: INITIAL_ROTATION,
        position: [0, 0, 0],
        scale: [scale, scale, scale]
      });
    }
  }, [model]);

  // Effect for model URL changes
  useEffect(() => {
    if (modelUrl && meshRef.current) {
      // Reset position and set initial rotation when model changes
      meshRef.current.position.set(0, 0, 0);
      meshRef.current.rotation.set(INITIAL_ROTATION[0], INITIAL_ROTATION[1], INITIAL_ROTATION[2]);

      // Update model state with initial rotation
      onModelStateChange?.({
        rotation: INITIAL_ROTATION,
        position: [0, 0, 0],
        scale: meshRef.current.scale.toArray() as [number, number, number]
      });
    }
  }, [modelUrl]);

  useFrame((state, delta) => {
    if (meshRef.current && isRotating) {
      meshRef.current.rotation.y += delta * 0.5;
      onModelStateChange?.({
        rotation: [meshRef.current.rotation.x, meshRef.current.rotation.y, meshRef.current.rotation.z],
        position: [meshRef.current.position.x, meshRef.current.position.y, meshRef.current.position.z],
        scale: meshRef.current.scale.toArray()
      });
    }
    // Apply zoom to both mesh and grid
    if (meshRef.current) {
      meshRef.current.scale.set(zoom, zoom, zoom);
    }
    if (gridRef.current) {
      // Scale the grid proportionally with the zoom
      const gridScale = zoom;
      gridRef.current.scale.set(gridScale, gridScale, gridScale);

      // Adjust grid position to maintain contact with the model
      const adjustedHeight = -modelHeight * zoom / 2 + 0.05;
      gridRef.current.position.set(0, adjustedHeight, 0);
    }
  });

  return (
    <>
      <gridHelper
        ref={gridRef}
        args={[2, 10, "#67B7D1", "#67B7D1"]}
        position={[0, -modelHeight / 2 + 0.05, 0]}
      />

      <mesh
        ref={meshRef}
        position={modelState?.position || [0, 0, 0]}
        rotation={modelState?.rotation || INITIAL_ROTATION} // Use INITIAL_ROTATION as default
        scale={modelState?.scale || [1, 1, 1]}
        castShadow
        receiveShadow
      >
        {model ? (
          <primitive object={model.scene} />
        ) : null}
      </mesh>
    </>
  );
}