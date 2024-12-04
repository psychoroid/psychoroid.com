'use client';

import React, { useRef, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Mesh, TextureLoader, Box3, Vector3 } from 'three';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { ProductProps } from '@/types/components';

export function Product({ imageUrl, modelUrl, isRotating = true, zoom = 1 }: ProductProps) {
  const meshRef = useRef<Mesh>(null);
  const model = modelUrl ? useLoader(GLTFLoader, modelUrl) : null;

  useEffect(() => {
    if (model && meshRef.current) {
      const box = new Box3().setFromObject(model.scene);
      const size = box.getSize(new Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z);
      const scale = 1 / maxDimension;
      meshRef.current.scale.set(scale, scale, scale);
    }
  }, [model]);

  useFrame((state, delta) => {
    if (meshRef.current && isRotating) {
      meshRef.current.rotation.y += delta * 0.5;
    }
    if (meshRef.current) {
      meshRef.current.scale.set(zoom, zoom, zoom);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} scale={[1, 1, 1]} castShadow receiveShadow>
      {model ? (
        <primitive object={model.scene} />
      ) : null}
    </mesh>
  );
}