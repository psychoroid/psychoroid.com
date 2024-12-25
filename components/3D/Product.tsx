'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useLoader } from '@react-three/fiber';
import { Mesh, Box3, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { ProductProps } from '@/types/components';

const INITIAL_ROTATION: [number, number, number] = [0, Math.PI, 0];

export function Product({
  modelUrl,
  isRotating = false,
  zoom = 1,
  modelState,
  onModelStateChange,
  scale = [1, 1, 1],
}: ProductProps) {
  const meshRef = useRef<Mesh>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Only load if we have a URL
  const gltf = useLoader(GLTFLoader, modelUrl || '', (loader) => {
    loader.setCrossOrigin('anonymous');
  });

  // Initialize model position and scale once
  useEffect(() => {
    if (!modelUrl || !meshRef.current || !gltf || isInitialized) return;

    // Calculate bounding box
    const box = new Box3().setFromObject(gltf.scene);
    const center = box.getCenter(new Vector3());
    const size = box.getSize(new Vector3());

    // Calculate scale to normalize model size
    const maxDimension = Math.max(size.x, size.y, size.z);
    const targetScale = 3 / maxDimension;

    // Position model at the center
    const newPosition: [number, number, number] = [0, 0, 0];

    // Center the model
    gltf.scene.position.set(-center.x, -center.y, -center.z);

    // Update model state once
    onModelStateChange?.({
      rotation: INITIAL_ROTATION,
      position: newPosition,
      scale: [targetScale, targetScale, targetScale]
    });

    setIsInitialized(true);
  }, [modelUrl, onModelStateChange, gltf, isInitialized]);

  if (!gltf || !modelUrl) {
    return null;
  }

  return (
    <primitive
      ref={meshRef}
      object={gltf.scene}
      scale={modelState?.scale || [1, 1, 1]}
      position={modelState?.position || [0, 0, 0]}
      rotation={modelState?.rotation || INITIAL_ROTATION}
    />
  );
}