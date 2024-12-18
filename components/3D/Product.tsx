'use client';

import React, { useRef, useEffect, useState, Suspense } from 'react';
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

function ModelLoader({ url, onLoad, onError, onProgress }: {
  url: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}) {
  const [model, setModel] = useState<GLTFResult | null>(null);

  useEffect(() => {
    if (!url) return;

    let mounted = true;

    const loadModel = async () => {
      try {
        const gltf = await new Promise<GLTFResult>((resolve, reject) => {
          const loader = new GLTFLoader();
          loader.load(
            url,
            (gltf) => resolve(gltf as GLTFResult),
            (event) => {
              if (event instanceof ProgressEvent) {
                const progress = (event.loaded / event.total) * 100;
                onProgress?.(progress);
              }
            },
            (error) => {
              console.error('Error loading model:', error);
              if (!(error instanceof ProgressEvent)) {
                reject(error);
              }
            }
          );
        });

        if (mounted) {
          setModel(gltf);
          onLoad?.();
        }
      } catch (error) {
        console.error('Error in loadModel:', error);
        if (error instanceof Error) {
          onError?.(error);
        }
      }
    };

    loadModel();

    return () => {
      mounted = false;
    };
  }, [url, onLoad, onError, onProgress]);

  if (!model) return null;
  return <primitive object={model.scene} />;
}

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
  const [loadError, setLoadError] = useState<Error | null>(null);

  // Effect for initial model setup
  useEffect(() => {
    if (!modelUrl || loadError) {
      return;
    }

    if (meshRef.current) {
      try {
        meshRef.current.scale.set(scale[0], scale[1], scale[2]);
        meshRef.current.rotation.set(INITIAL_ROTATION[0], INITIAL_ROTATION[1], INITIAL_ROTATION[2]);

        onModelStateChange?.({
          rotation: INITIAL_ROTATION,
          position: [0, 0, 0],
          scale: scale
        });
      } catch (error) {
        console.error('Error setting up model:', error);
        if (error instanceof Error) {
          setLoadError(error);
          onError?.(error);
        }
      }
    }
  }, [modelUrl, onModelStateChange, onError, loadError, scale]);

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

  const handleModelLoad = () => {
    if (meshRef.current) {
      try {
        const box = new Box3().setFromObject(meshRef.current);
        const size = box.getSize(new Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z);
        const newScale = 1 / maxDimension;
        meshRef.current.scale.set(newScale, newScale, newScale);

        const scaledHeight = size.y * newScale;
        setModelHeight(scaledHeight);

        onLoad?.();
      } catch (error) {
        console.error('Error in handleModelLoad:', error);
        if (error instanceof Error) {
          setLoadError(error);
          onError?.(error);
        }
      }
    }
  };

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
        <Suspense fallback={<meshStandardMaterial color="#cccccc" opacity={0.5} transparent />}>
          {modelUrl && !loadError ? (
            <ModelLoader
              url={modelUrl}
              onLoad={handleModelLoad}
              onError={(error) => {
                setLoadError(error);
                onError?.(error);
              }}
              onProgress={onProgress}
            />
          ) : (
            <meshStandardMaterial color={loadError ? "#ff0000" : "#cccccc"} opacity={0.5} transparent />
          )}
        </Suspense>
      </mesh>
    </>
  );
}