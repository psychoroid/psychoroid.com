'use client';

import React, { useRef, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Mesh, TextureLoader } from 'three';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

interface ProductProps {
  imageUrl?: string;
  modelUrl?: string;
  isRotating?: boolean;
  zoom?: number;
}

export function Product({ imageUrl, modelUrl, isRotating = true, zoom = 1 }: ProductProps) {
  const meshRef = useRef<Mesh>(null);
  const texture = imageUrl ? useLoader(TextureLoader, imageUrl) : null;

  // Load model if modelUrl is provided
  // @ts-ignore
  const model = modelUrl ? useLoader(GLTFLoader, modelUrl) : null;

  useFrame((state, delta) => {
    if (meshRef.current && isRotating) {
      meshRef.current.rotation.y += delta * 0.5;
    }
    if (meshRef.current) {
      meshRef.current.scale.set(zoom, zoom, zoom);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} castShadow receiveShadow>
      {model ? (
        <primitive object={model.scene} />
      ) : (
        <>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial
              map={texture || undefined}
              color={imageUrl ? 'white' : '#4a90e2'}
              metalness={0.1}
              roughness={0.5}
            />
          </mesh>
        </>
      )}
    </mesh>
  );
}