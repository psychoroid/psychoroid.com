'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Mesh, TextureLoader, Box3, Vector3, GridHelper, Group } from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { ProductProps } from '@/types/components';

// Define the GLTF result type
type GLTFResult = GLTF & {
  nodes: { [key: string]: THREE.Mesh };
  materials: { [key: string]: THREE.Material };
};

const INITIAL_ROTATION: [number, number, number] = [0, Math.PI, 0];

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
  onProgress
}: ProductProps): JSX.Element {
  const meshRef = useRef<Mesh>(null);
  const gridRef = useRef<GridHelper>(null);
  const [modelHeight, setModelHeight] = useState(0);

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

  // Effect for initial model setup
  useEffect(() => {
    if (!modelUrl) {
      onError?.(new Error('No model URL provided'));
      return;
    }

    if (model && meshRef.current) {
      try {
        const box = new Box3().setFromObject(model.scene);
        const size = box.getSize(new Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z);
        const scale = 1 / maxDimension;
        meshRef.current.scale.set(scale, scale, scale);

        meshRef.current.rotation.set(INITIAL_ROTATION[0], INITIAL_ROTATION[1], INITIAL_ROTATION[2]);

        const scaledHeight = size.y * scale;
        setModelHeight(scaledHeight);

        onModelStateChange?.({
          rotation: INITIAL_ROTATION,
          position: [0, 0, 0],
          scale: [scale, scale, scale]
        });

        onLoad?.();
      } catch (error) {
        console.error('Error setting up model:', error);
        onError?.(error);
      }
    }
  }, [model, onModelStateChange, onLoad, onError, modelUrl]);

  useEffect(() => {
    if (modelUrl && meshRef.current) {
      meshRef.current.position.set(0, 0, 0);
      meshRef.current.rotation.set(INITIAL_ROTATION[0], INITIAL_ROTATION[1], INITIAL_ROTATION[2]);

      onModelStateChange?.({
        rotation: INITIAL_ROTATION,
        position: [0, 0, 0],
        scale: meshRef.current.scale.toArray() as [number, number, number]
      });
    }
  }, [modelUrl, onModelStateChange]);

  useFrame((state, delta) => {
    if (meshRef.current && isRotating) {
      meshRef.current.rotation.y += delta * 0.5;
      onModelStateChange?.({
        rotation: [meshRef.current.rotation.x, meshRef.current.rotation.y, meshRef.current.rotation.z],
        position: [meshRef.current.position.x, meshRef.current.position.y, meshRef.current.position.z],
        scale: meshRef.current.scale.toArray() as [number, number, number]
      });
    }
    if (meshRef.current) {
      meshRef.current.scale.set(zoom * scale[0], zoom * scale[1], zoom * scale[2]);
    }
    if (gridRef.current) {
      const gridScale = zoom;
      gridRef.current.scale.set(gridScale, gridScale, gridScale);
      const adjustedHeight = -modelHeight * zoom / 2 + 0.05;
      gridRef.current.position.set(0, adjustedHeight, 0);
    }
  });

  return (
    <>
      <gridHelper
        ref={gridRef}
        args={[2, 10, "#67B7D1", "#67B7D1"]}
        position={[0, -modelHeight / 2 + 0.07, 0]}
      />
      <mesh
        ref={meshRef}
        position={modelState?.position || [0, 0, 0]}
        rotation={modelState?.rotation || INITIAL_ROTATION}
        scale={modelState?.scale || scale}
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