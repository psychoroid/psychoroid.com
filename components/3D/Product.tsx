'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useLoader } from '@react-three/fiber';
import { Mesh, Box3, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { ProductProps } from '@/types/components';

const INITIAL_ROTATION: [number, number, number] = [0, 0, 0];

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
  const [error, setError] = useState<string | null>(null);

  // Only load if we have a valid URL
  const gltf = useLoader(
    GLTFLoader,
    modelUrl || '',
    (loader) => {
      loader.setCrossOrigin('anonymous');
    },
    (error) => {
      console.error('Error loading model:', error);
      setError('Failed to load model');
    }
  );

  // Initialize model position and scale once
  useEffect(() => {
    if (!modelUrl || !meshRef.current || !gltf || isInitialized || error) return;

    try {
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
    } catch (err) {
      console.error('Error initializing model:', err);
      setError('Failed to initialize model');
    }
  }, [modelUrl, onModelStateChange, gltf, isInitialized, error]);

  // Skip rendering if it's a default asset or there's an error
  if (!gltf || !modelUrl || error || modelUrl?.includes('default-assets/')) {
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