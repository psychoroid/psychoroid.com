'use client';

import React, { useRef, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { Vector3, Camera } from 'three';

export function ViewCube() {
    const { camera } = useThree();
    const cubeRef = useRef<HTMLDivElement>(null);

    const handleFaceClick = (position: [number, number, number]) => {
        if (!camera) return;

        // Calculate the current distance from the camera to the origin
        const distance = camera.position.length();

        // Create target position vector
        const targetPosition = new Vector3(...position).multiplyScalar(distance);

        // Smoothly animate camera to the new position
        const duration = 1000; // 1 second
        const startPosition = camera.position.clone();
        const startTime = Date.now();

        function animate() {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease function (cubic)
            const t = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            camera.position.lerpVectors(startPosition, targetPosition, t);
            camera.lookAt(0, 0, 0);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }

        animate();
    };

    // Update cube rotation to match camera
    useEffect(() => {
        const updateCubeRotation = () => {
            if (cubeRef.current && camera) {
                const rotation = camera.rotation;
                cubeRef.current.style.transform = `rotateX(${-rotation.x}rad) rotateY(${-rotation.y}rad) rotateZ(${-rotation.z}rad)`;
            }
        };

        // Initial update
        updateCubeRotation();

        // Update on each frame
        const animate = () => {
            updateCubeRotation();
            requestAnimationFrame(animate);
        };

        const animationFrame = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationFrame);
        };
    }, [camera]);

    return (
        <Html
            position={[0, 0, 0]}
            style={{
                position: 'absolute',
                bottom: '20px',
                right: '20px',
                width: '80px',
                height: '80px',
                pointerEvents: 'none',
                perspective: '600px'
            }}
        >
            <div
                ref={cubeRef}
                className="relative w-full h-full"
                style={{
                    transformStyle: 'preserve-3d',
                    transform: `rotateX(${-camera.rotation.x}rad) rotateY(${-camera.rotation.y}rad) rotateZ(${-camera.rotation.z}rad)`
                }}
            >
                {/* Front face */}
                <button
                    onClick={() => handleFaceClick([0, 0, 1])}
                    className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm hover:bg-background/90 border rounded-none text-xs font-medium pointer-events-auto transform-gpu"
                    style={{ transform: 'translateZ(40px)' }}
                >
                    Front
                </button>
                {/* Right face */}
                <button
                    onClick={() => handleFaceClick([1, 0, 0])}
                    className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm hover:bg-background/90 border rounded-none text-xs font-medium pointer-events-auto transform-gpu"
                    style={{ transform: 'rotateY(90deg) translateZ(40px)' }}
                >
                    Right
                </button>
                {/* Left face */}
                <button
                    onClick={() => handleFaceClick([-1, 0, 0])}
                    className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm hover:bg-background/90 border rounded-none text-xs font-medium pointer-events-auto transform-gpu"
                    style={{ transform: 'rotateY(-90deg) translateZ(40px)' }}
                >
                    Left
                </button>
                {/* Top face */}
                <button
                    onClick={() => handleFaceClick([0, 1, 0])}
                    className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm hover:bg-background/90 border rounded-none text-xs font-medium pointer-events-auto transform-gpu"
                    style={{ transform: 'rotateX(-90deg) translateZ(40px)' }}
                >
                    Top
                </button>
                {/* Bottom face */}
                <button
                    onClick={() => handleFaceClick([0, -1, 0])}
                    className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm hover:bg-background/90 border rounded-none text-xs font-medium pointer-events-auto transform-gpu"
                    style={{ transform: 'rotateX(90deg) translateZ(40px)' }}
                >
                    Bottom
                </button>
                {/* Back face */}
                <button
                    onClick={() => handleFaceClick([0, 0, -1])}
                    className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm hover:bg-background/90 border rounded-none text-xs font-medium pointer-events-auto transform-gpu"
                    style={{ transform: 'rotateY(180deg) translateZ(40px)' }}
                >
                    Back
                </button>
            </div>
        </Html>
    );
} 