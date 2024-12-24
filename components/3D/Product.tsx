'use client';

import React, { useRef, useEffect, useState, Suspense } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Mesh, TextureLoader, Box3, Vector3, GridHelper, Group, LineBasicMaterial, BufferGeometry, Line, Float32BufferAttribute } from 'three';
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
      onModelStateChange?.({
        rotation: [
          meshRef.current.rotation.x,
          meshRef.current.rotation.y,
          meshRef.current.rotation.z
        ],
        position: [
          meshRef.current.position.x,
          meshRef.current.position.y,
          meshRef.current.position.z
        ],
        scale: meshRef.current.scale.toArray() as [number, number, number]
      });
    }

    // Update model scale with zoom
    if (meshRef.current) {
      const currentScale = zoom * scale[0];
      meshRef.current.scale.set(currentScale, currentScale, currentScale);
    }

    // Keep grid scale consistent and ensure it's flat
    if (gridRef.current) {
      gridRef.current.scale.set(1, 1, 1);
    }
  });

  const handleModelLoad = () => {
    if (meshRef.current) {
      try {
        // Calculate bounding box
        const box = new Box3().setFromObject(meshRef.current);
        const size = box.getSize(new Vector3());
        const center = box.getCenter(new Vector3());

        // Calculate scale to normalize model size
        const maxDimension = Math.max(size.x, size.y, size.z);
        const newScale = 1 / maxDimension;

        // Apply scale
        meshRef.current.scale.set(newScale, newScale, newScale);

        // Calculate height after scaling
        const scaledHeight = size.y * newScale;
        setModelHeight(scaledHeight);

        // Position model to sit on grid
        meshRef.current.position.set(
          -center.x * newScale,
          scaledHeight / 2,
          -center.z * newScale
        );

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
        args={[8, 20, "#67B7D1", "#67B7D1"]}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
        material-opacity={0.15}
        material-transparent={true}
      />
      {/* Horizontal line 1 (X direction) */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([-4, 0, 0, 4, 0, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#94a3b8" opacity={0.4} transparent linewidth={2} depthTest={false} />
      </line>
      {/* Horizontal line 2 (Z direction) */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, -4, 0, 0, 4])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#94a3b8" opacity={0.4} transparent linewidth={2} depthTest={false} />
      </line>
      {/* Positive X-axis (red) */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, 4, 0, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ff6b6b" opacity={0.4} transparent linewidth={3} depthTest={false} />
      </line>
      {/* Negative X-axis (purple) */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, -4, 0, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#be4bdb" opacity={0.4} transparent linewidth={3} depthTest={false} />
      </line>
      {/* Positive Z-axis (green) */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, 0, 0, 4])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#69db7c" opacity={0.4} transparent linewidth={3} depthTest={false} />
      </line>
      {/* Negative Z-axis (cyan) */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, 0, 0, -4])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#22b8cf" opacity={0.4} transparent linewidth={3} depthTest={false} />
      </line>
      <mesh
        ref={meshRef}
        position={[0, 0, 0]}
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