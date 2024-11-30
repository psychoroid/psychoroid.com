'use client';

import React, { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Mesh, TextureLoader } from 'three';

interface ProductProps {
  imageUrl?: string;
}

export function Product({ imageUrl }: ProductProps) {
  const meshRef = useRef<Mesh>(null);
  const texture = imageUrl ? useLoader(TextureLoader, imageUrl) : null;

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} castShadow receiveShadow>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial
        map={texture || undefined}
        color={imageUrl ? 'white' : '#4a90e2'}
        metalness={0.1}
        roughness={0.5}
      />
    </mesh>
  );
}